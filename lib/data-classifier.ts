/**
 * AI JOKER-C2 Data Classifier
 *
 * Deterministic data sensitivity classifier for the HERMETICUM B.C.E.
 * governed runtime.
 *
 * This module classifies text, file names, MIME types and route context into:
 * - PUBLIC
 * - INTERNAL
 * - CONFIDENTIAL
 * - SENSITIVE
 * - SECRET
 * - PERSONAL
 * - SECURITY_SENSITIVE
 * - CRITICAL_OPERATIONAL
 * - UNSUPPORTED
 * - UNKNOWN
 *
 * The classifier is intentionally transparent and rule-based.
 * It does not execute files.
 * It does not call external models.
 */

import type { DataClass, DataClassification } from "./runtime-types";

export type DataClassifierInput = {
  text?: string;
  fileName?: string;
  mimeType?: string;
  route?: string;
};

type PatternRule = {
  dataClass: DataClass;
  label: string;
  patterns: RegExp[];
  reason: string;
};

const SECRET_RULES: PatternRule[] = [
  {
    dataClass: "SECRET",
    label: "OPENAI_OR_PROVIDER_KEY",
    reason: "Input appears to contain an API key or provider secret.",
    patterns: [
      /\bOPENAI_API_KEY\b/i,
      /\bANTHROPIC_API_KEY\b/i,
      /\bGOOGLE_API_KEY\b/i,
      /\b[A-Za-z0-9_]*API[_-]?KEY[A-Za-z0-9_]*\s*[:=]\s*["']?[A-Za-z0-9._-]{12,}/i,
      /\bsk-[A-Za-z0-9_-]{20,}\b/i,
      /\bsk-proj-[A-Za-z0-9_-]{20,}\b/i
    ]
  },
  {
    dataClass: "SECRET",
    label: "TOKEN_OR_AUTH_HEADER",
    reason: "Input appears to contain an access token or authorization header.",
    patterns: [
      /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/-]+=*/i,
      /\baccess[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{16,}/i,
      /\brefresh[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{16,}/i,
      /\bgithub[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._-]{16,}/i,
      /\bvercel[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._-]{16,}/i,
      /\bJWT\b\s*[:=]?\s*eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i
    ]
  },
  {
    dataClass: "SECRET",
    label: "PASSWORD_OR_PRIVATE_KEY",
    reason: "Input appears to contain a password, private key or signing secret.",
    patterns: [
      /\bpassword\s*[:=]\s*["']?[^"'\s]{8,}/i,
      /\bpasswd\s*[:=]\s*["']?[^"'\s]{8,}/i,
      /\bsecret\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{12,}/i,
      /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/i,
      /\bprivate[_-]?key\s*[:=]/i,
      /\bsigning[_-]?key\s*[:=]/i,
      /\bwebhook[_-]?secret\s*[:=]/i
    ]
  },
  {
    dataClass: "SECRET",
    label: "ENV_FILE_SECRET_CONTEXT",
    reason:
      "Input or file context appears to reference an environment file containing secrets.",
    patterns: [
      /\.env(\.local|\.production|\.preview|\.development)?\b/i,
      /\benv\.local\b/i,
      /\bDATABASE_URL\s*=/i,
      /\bSESSION_SECRET\s*=/i,
      /\bNEXTAUTH_SECRET\s*=/i
    ]
  }
];

const CRITICAL_OPERATIONAL_RULES: PatternRule[] = [
  {
    dataClass: "CRITICAL_OPERATIONAL",
    label: "CRITICAL_INFRASTRUCTURE",
    reason:
      "Input appears related to critical infrastructure or essential services.",
    patterns: [
      /\bcritical infrastructure\b/i,
      /\benergy grid\b/i,
      /\bpower grid\b/i,
      /\btelecommunications\b/i,
      /\btelecom\b/i,
      /\bdata center\b/i,
      /\bpublic service\b/i,
      /\bemergency system\b/i,
      /\bcivil protection\b/i,
      /\bSCADA\b/i,
      /\bICS\b/i,
      /\bOT network\b/i,
      /\binfrastruttura critica\b/i,
      /\brete elettrica\b/i,
      /\bprotezione civile\b/i,
      /\bservizio pubblico\b/i
    ]
  },
  {
    dataClass: "CRITICAL_OPERATIONAL",
    label: "LIVE_OPERATIONAL_SYSTEM",
    reason: "Input appears related to live production or operational systems.",
    patterns: [
      /\bproduction system\b/i,
      /\blive system\b/i,
      /\boperational control\b/i,
      /\bincident command\b/i,
      /\bpublic safety\b/i,
      /\bsafety critical\b/i,
      /\bsistema in produzione\b/i,
      /\bsistema live\b/i,
      /\bcontrollo operativo\b/i,
      /\bsicurezza pubblica\b/i
    ]
  }
];

const PERSONAL_RULES: PatternRule[] = [
  {
    dataClass: "PERSONAL",
    label: "EMAIL_OR_PHONE",
    reason: "Input appears to contain personal contact information.",
    patterns: [
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
      /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/
    ]
  },
  {
    dataClass: "PERSONAL",
    label: "ITALIAN_PERSONAL_IDENTIFIER",
    reason: "Input appears to contain Italian personal identifier data.",
    patterns: [
      /\b[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]\b/i,
      /\bcodice fiscale\b/i,
      /\btessera sanitaria\b/i,
      /\bcarta d['’]?identita\b/i,
      /\bpassaporto\b/i
    ]
  },
  {
    dataClass: "PERSONAL",
    label: "PERSONAL_DATA_CONTEXT",
    reason: "Input explicitly references personal data.",
    patterns: [
      /\bpersonal data\b/i,
      /\bpersonally identifiable\b/i,
      /\bPII\b/i,
      /\bGDPR\b/i,
      /\bdati personali\b/i,
      /\bdato personale\b/i,
      /\bprivacy\b/i,
      /\bdata subject\b/i,
      /\binteressato\b/i
    ]
  }
];

const SECURITY_SENSITIVE_RULES: PatternRule[] = [
  {
    dataClass: "SECURITY_SENSITIVE",
    label: "SECURITY_OPERATION",
    reason: "Input appears to contain security-sensitive operational content.",
    patterns: [
      /\bsecurity incident\b/i,
      /\bcybersecurity incident\b/i,
      /\bbreach\b/i,
      /\bintrusion\b/i,
      /\bSOC\b/i,
      /\bSIEM\b/i,
      /\bEDR\b/i,
      /\bXDR\b/i,
      /\blog extract\b/i,
      /\bstack trace\b/i,
      /\bfirewall\b/i,
      /\bthreat\b/i,
      /\bindicator of compromise\b/i,
      /\bIOC\b/i,
      /\bincidente di sicurezza\b/i,
      /\bviolazione\b/i,
      /\blog di sicurezza\b/i
    ]
  },
  {
    dataClass: "SECURITY_SENSITIVE",
    label: "VULNERABILITY_OR_CVE",
    reason: "Input appears to reference vulnerabilities or security findings.",
    patterns: [
      /\bCVE-\d{4}-\d{4,}\b/i,
      /\bvulnerability\b/i,
      /\bvulnerabilit[aà]\b/i,
      /\bexploit\b/i,
      /\bpatch\b/i,
      /\bremediation\b/i,
      /\bhardening\b/i,
      /\bmitigation\b/i,
      /\bzero[- ]day\b/i
    ]
  },
  {
    dataClass: "SECURITY_SENSITIVE",
    label: "NETWORK_OR_INFRASTRUCTURE_DETAILS",
    reason: "Input appears to contain network or infrastructure details.",
    patterns: [
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
      /\bport\s+\d{1,5}\b/i,
      /\bsubnet\b/i,
      /\bCIDR\b/i,
      /\bVPN\b/i,
      /\bSSH\b/i,
      /\bRDP\b/i,
      /\bendpoint\b/i,
      /\bserver\b/i,
      /\bdatabase\b/i
    ]
  }
];

const CONFIDENTIAL_RULES: PatternRule[] = [
  {
    dataClass: "CONFIDENTIAL",
    label: "CONFIDENTIAL_MARKER",
    reason: "Input appears to contain confidential or restricted business material.",
    patterns: [
      /\bconfidential\b/i,
      /\binternal only\b/i,
      /\bnot for distribution\b/i,
      /\bNDA\b/i,
      /\bproprietary\b/i,
      /\btrade secret\b/i,
      /\briservato\b/i,
      /\bconfidenziale\b/i,
      /\bsolo uso interno\b/i,
      /\bnon distribuire\b/i,
      /\bsegreto industriale\b/i
    ]
  },
  {
    dataClass: "CONFIDENTIAL",
    label: "BUSINESS_SENSITIVE",
    reason:
      "Input appears to contain sensitive business or institutional material.",
    patterns: [
      /\bcontract\b/i,
      /\bprocurement\b/i,
      /\btender\b/i,
      /\bbid\b/i,
      /\bfinancial report\b/i,
      /\blegal review\b/i,
      /\bboard\b/i,
      /\bexecutive summary\b/i,
      /\bcontratto\b/i,
      /\bappalto\b/i,
      /\bgara\b/i,
      /\bofferta tecnica\b/i,
      /\brevisione legale\b/i
    ]
  }
];

const SENSITIVE_RULES: PatternRule[] = [
  {
    dataClass: "SENSITIVE",
    label: "GENERIC_SENSITIVE_CONTEXT",
    reason: "Input explicitly references sensitive or protected information.",
    patterns: [
      /\bsensitive\b/i,
      /\bprotected information\b/i,
      /\brestricted information\b/i,
      /\bnon-public\b/i,
      /\bnon public\b/i,
      /\bclassified internally\b/i,
      /\bdato sensibile\b/i,
      /\bdati sensibili\b/i,
      /\binformazione sensibile\b/i,
      /\binformazioni sensibili\b/i,
      /\binformazione protetta\b/i,
      /\binformazioni protette\b/i
    ]
  }
];

const UNSUPPORTED_RULES: PatternRule[] = [
  {
    dataClass: "UNSUPPORTED",
    label: "UNSUPPORTED_EXECUTABLE_OR_BINARY_FILE",
    reason:
      "Input appears to reference an unsupported executable, archive or binary file type.",
    patterns: [
      /\.exe\b/i,
      /\.dll\b/i,
      /\.so\b/i,
      /\.dylib\b/i,
      /\.bin\b/i,
      /\.apk\b/i,
      /\.ipa\b/i,
      /\.deb\b/i,
      /\.rpm\b/i,
      /\.msi\b/i,
      /\.zip\b/i,
      /\.rar\b/i,
      /\.7z\b/i,
      /\.tar\b/i,
      /\.gz\b/i,
      /\bapplication\/octet-stream\b/i,
      /\bapplication\/x-msdownload\b/i,
      /\bapplication\/x-executable\b/i
    ]
  }
];

const INTERNAL_RULES: PatternRule[] = [
  {
    dataClass: "INTERNAL",
    label: "INTERNAL_PROJECT_CONTEXT",
    reason:
      "Input appears to contain internal project, repository or runtime context.",
    patterns: [
      /\brepository\b/i,
      /\brepo\b/i,
      /\bgithub\b/i,
      /\bcommit\b/i,
      /\bbranch\b/i,
      /\bruntime\b/i,
      /\bdiagnostic\b/i,
      /\bdiagnostics\b/i,
      /\bdeployment\b/i,
      /\bvercel\b/i,
      /\bapi route\b/i,
      /\bprogetto interno\b/i,
      /\bdiagnostica\b/i
    ]
  }
];

const PUBLIC_RULES: PatternRule[] = [
  {
    dataClass: "PUBLIC",
    label: "PUBLIC_DOCUMENTATION_CONTEXT",
    reason:
      "Input appears to be public documentation or ordinary non-sensitive content.",
    patterns: [
      /\breadme\b/i,
      /\bpublic documentation\b/i,
      /\bdocs\//i,
      /\bmarkdown\b/i,
      /\boverview\b/i,
      /\btemplate\b/i,
      /\bchecklist\b/i,
      /\broadmap\b/i,
      /\bdocumentazione pubblica\b/i,
      /\bpanoramica\b/i
    ]
  }
];

const ALL_RULES_IN_PRIORITY_ORDER: PatternRule[] = [
  ...SECRET_RULES,
  ...UNSUPPORTED_RULES,
  ...CRITICAL_OPERATIONAL_RULES,
  ...PERSONAL_RULES,
  ...SECURITY_SENSITIVE_RULES,
  ...CONFIDENTIAL_RULES,
  ...SENSITIVE_RULES,
  ...INTERNAL_RULES,
  ...PUBLIC_RULES
];

const DATA_CLASS_RANK: Record<DataClass, number> = {
  UNKNOWN: 0,
  PUBLIC: 1,
  INTERNAL: 2,
  CONFIDENTIAL: 3,
  SENSITIVE: 4,
  PERSONAL: 5,
  SECURITY_SENSITIVE: 6,
  CRITICAL_OPERATIONAL: 7,
  SECRET: 8,
  UNSUPPORTED: 9
};

export function classifyData(input: DataClassifierInput): DataClassification {
  const combined = normalizeInput(input);

  if (!combined.trim()) {
    return {
      dataClass: "UNKNOWN",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: ["No text, file name, MIME type or route context was provided."]
    };
  }

  const matchedRules = findMatchedRules(combined);
  const dataClass = selectHighestDataClass(matchedRules);

  const containsSecret = matchedRules.some((rule) => rule.dataClass === "SECRET");

  const containsPersonalData = matchedRules.some(
    (rule) => rule.dataClass === "PERSONAL"
  );

  const containsSecuritySensitiveData = matchedRules.some((rule) =>
    [
      "SENSITIVE",
      "SECURITY_SENSITIVE",
      "CRITICAL_OPERATIONAL",
      "SECRET",
      "UNSUPPORTED"
    ].includes(rule.dataClass)
  );

  const reasons = matchedRules.flatMap((rule) => [
    rule.reason,
    `Matched data rule: ${rule.label}`
  ]);

  if (matchedRules.length === 0) {
    return classifyUnknownOrPublicFallback(input, combined);
  }

  return {
    dataClass,
    containsSecret,
    containsPersonalData,
    containsSecuritySensitiveData,
    reasons: uniqueReasons([...reasons, `Data classified as ${dataClass}.`])
  };
}

export function classifyTextData(text: string): DataClassification {
  return classifyData({ text });
}

export function classifyFileData(input: {
  fileName?: string;
  mimeType?: string;
  text?: string;
}): DataClassification {
  return classifyData({
    text: input.text,
    fileName: input.fileName,
    mimeType: input.mimeType
  });
}

export function isSecretData(classification: DataClassification): boolean {
  return classification.dataClass === "SECRET" || classification.containsSecret;
}

export function isUnsupportedData(
  classification: DataClassification
): boolean {
  return classification.dataClass === "UNSUPPORTED";
}

export function requiresDataMinimization(
  classification: DataClassification
): boolean {
  return [
    "CONFIDENTIAL",
    "SENSITIVE",
    "PERSONAL",
    "SECURITY_SENSITIVE",
    "CRITICAL_OPERATIONAL",
    "SECRET",
    "UNSUPPORTED",
    "UNKNOWN"
  ].includes(classification.dataClass);
}

export function requiresDataReview(
  classification: DataClassification
): boolean {
  return [
    "CONFIDENTIAL",
    "SENSITIVE",
    "PERSONAL",
    "SECURITY_SENSITIVE",
    "CRITICAL_OPERATIONAL",
    "SECRET",
    "UNSUPPORTED",
    "UNKNOWN"
  ].includes(classification.dataClass);
}

export function canProcessAsOrdinaryContent(
  classification: DataClassification
): boolean {
  return (
    classification.dataClass === "PUBLIC" ||
    classification.dataClass === "INTERNAL"
  );
}

export function shouldBlockDataProcessing(
  classification: DataClassification
): boolean {
  return (
    classification.dataClass === "SECRET" ||
    classification.dataClass === "UNSUPPORTED"
  );
}

export function buildDataHandlingSummary(
  classification: DataClassification
): string {
  return [
    `Data class: ${classification.dataClass}`,
    `Contains secret: ${classification.containsSecret ? "yes" : "no"}`,
    `Contains personal data: ${
      classification.containsPersonalData ? "yes" : "no"
    }`,
    `Contains security-sensitive data: ${
      classification.containsSecuritySensitiveData ? "yes" : "no"
    }`
  ].join("\n");
}

function findMatchedRules(text: string): PatternRule[] {
  return ALL_RULES_IN_PRIORITY_ORDER.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(text))
  );
}

function selectHighestDataClass(rules: PatternRule[]): DataClass {
  if (rules.length === 0) {
    return "UNKNOWN";
  }

  return rules.reduce<DataClass>((highest, rule) => {
    return DATA_CLASS_RANK[rule.dataClass] > DATA_CLASS_RANK[highest]
      ? rule.dataClass
      : highest;
  }, "UNKNOWN");
}

function classifyUnknownOrPublicFallback(
  input: DataClassifierInput,
  combined: string
): DataClassification {
  if (looksLikePlainPublicDocumentation(input, combined)) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: [
        "No sensitive data pattern matched.",
        "Input appears to be ordinary public documentation or non-sensitive text.",
        "Data classified as PUBLIC."
      ]
    };
  }

  if (input.fileName || input.mimeType) {
    return {
      dataClass: "INTERNAL",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: [
        "File metadata is present but no sensitive pattern matched.",
        "File-backed content defaults to INTERNAL unless explicitly public.",
        "Data classified as INTERNAL."
      ]
    };
  }

  return {
    dataClass: "UNKNOWN",
    containsSecret: false,
    containsPersonalData: false,
    containsSecuritySensitiveData: false,
    reasons: [
      "No known data pattern matched.",
      "Data sensitivity is unclear.",
      "Data classified as UNKNOWN."
    ]
  };
}

function looksLikePlainPublicDocumentation(
  input: DataClassifierInput,
  combined: string
): boolean {
  const safeFile =
    Boolean(input.fileName) && /\.(md|txt|json|csv)$/i.test(input.fileName ?? "");

  const publicWords =
    /\breadme\b/i.test(combined) ||
    /\bdocumentation\b/i.test(combined) ||
    /\bdocs\//i.test(combined) ||
    /\boverview\b/i.test(combined) ||
    /\btemplate\b/i.test(combined) ||
    /\bchecklist\b/i.test(combined);

  const hasNoSensitiveIndicators = ![
    ...SECRET_RULES,
    ...UNSUPPORTED_RULES,
    ...CRITICAL_OPERATIONAL_RULES,
    ...PERSONAL_RULES,
    ...SECURITY_SENSITIVE_RULES,
    ...CONFIDENTIAL_RULES,
    ...SENSITIVE_RULES
  ].some((rule) => rule.patterns.some((pattern) => pattern.test(combined)));

  return hasNoSensitiveIndicators && (safeFile || publicWords);
}

function normalizeInput(input: DataClassifierInput): string {
  return [input.text ?? "", input.fileName ?? "", input.mimeType ?? "", input.route ?? ""]
    .join(" ")
    .normalize("NFKC")
    .trim();
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
