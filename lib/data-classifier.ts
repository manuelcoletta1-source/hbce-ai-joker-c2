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
 * - CIVIC_SENSITIVE
 * - DEMOCRATIC_CHOICE
 * - SECURITY_SENSITIVE
 * - CRITICAL_OPERATIONAL
 * - UNSUPPORTED
 * - UNKNOWN
 *
 * The classifier is intentionally transparent and rule-based.
 * It does not execute files.
 * It does not call external models.
 *
 * HBCE ECOSISTEMA AI note:
 * References to AI governance, model governance, OpenAI, Anthropic, Google AI,
 * Mistral, Meta AI, AI audit or IPR AI Audit Trail are not sensitive by default.
 * They become sensitive only when combined with secrets, credentials, personal
 * data, operational systems, critical infrastructure, security findings,
 * democratic-choice content or unsupported data.
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

const CIVIC_SENSITIVE_RULES: PatternRule[] = [
  {
    dataClass: "CIVIC_SENSITIVE",
    label: "CIVIC_OR_DEMOCRATIC_INFRASTRUCTURE",
    reason:
      "Input appears related to civic, democratic or public decision infrastructure.",
    patterns: [
      /\bfederated digital vote\b/i,
      /\bfederated digital voting\b/i,
      /\bvoto digitale federato\b/i,
      /\bdemocratic infrastructure\b/i,
      /\binfrastruttura democratica\b/i,
      /\bpublic consultation\b/i,
      /\bconsultazione pubblica\b/i,
      /\breferendum infrastructure\b/i,
      /\binfrastruttura referendaria\b/i,
      /\breferendum digitale\b/i,
      /\bcivic participation\b/i,
      /\bpartecipazione civica\b/i,
      /\bparticipation rights\b/i,
      /\bdiritti di partecipazione\b/i,
      /\bpublic decision\b/i,
      /\bdecisione pubblica\b/i,
      /\bU\.S\.E\.\b/i,
      /\bUnited States of Europe\b/i,
      /\bStati Uniti d['’]?Europa\b/i
    ]
  },
  {
    dataClass: "CIVIC_SENSITIVE",
    label: "IDENTITY_OR_ELIGIBILITY_FOR_CIVIC_PROCESS",
    reason:
      "Input appears related to identity, eligibility or participation rights in a civic process.",
    patterns: [
      /\bidentity verification\b/i,
      /\bverifica identit[aà]\b/i,
      /\beligibility verification\b/i,
      /\bverifica eleggibilit[aà]\b/i,
      /\bparticipation proof\b/i,
      /\bprova di partecipazione\b/i,
      /\bcitizen identity\b/i,
      /\bidentit[aà] cittadino\b/i,
      /\bvoter identity\b/i,
      /\bidentit[aà] elettore\b/i
    ]
  }
];

const DEMOCRATIC_CHOICE_RULES: PatternRule[] = [
  {
    dataClass: "DEMOCRATIC_CHOICE",
    label: "DEMOCRATIC_CHOICE_CONTENT",
    reason:
      "Input appears to reference democratic choice, vote content or ballot content.",
    patterns: [
      /\bvote content\b/i,
      /\bballot content\b/i,
      /\bvoter choice\b/i,
      /\bchoice content\b/i,
      /\bpreferenza di voto\b/i,
      /\bvoto espresso\b/i,
      /\bcontenuto del voto\b/i,
      /\bcontenuto scheda\b/i,
      /\bscelta democratica\b/i,
      /\bscelta civica\b/i
    ]
  },
  {
    dataClass: "DEMOCRATIC_CHOICE",
    label: "IDENTITY_CHOICE_LINKAGE",
    reason:
      "Input appears to link identity or eligibility data with democratic choice content.",
    patterns: [
      /\blink voter identity to vote\b/i,
      /\blink identity to vote\b/i,
      /\bidentity-choice linkage\b/i,
      /\bde-anonymize vote\b/i,
      /\bdeanonymize vote\b/i,
      /\bvote de-anonymization\b/i,
      /\bcollegare identit[aà] e voto\b/i,
      /\bcollegare identit[aà] personale e scelta\b/i,
      /\bdeanonimizzare il voto\b/i,
      /\bde-anonimizzare il voto\b/i
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
  },
  {
    dataClass: "INTERNAL",
    label: "HBCE_AI_GOVERNANCE_CONTEXT",
    reason:
      "Input appears to contain HBCE ECOSISTEMA AI, AI governance, model governance or AI audit context without secrets or personal data.",
    patterns: [
      /\bHBCE ECOSISTEMA AI\b/i,
      /\becosistema AI\b/i,
      /\bAI governance\b/i,
      /\bgovernance AI\b/i,
      /\bgovernance dell['’]?AI\b/i,
      /\bgoverno dell['’]?AI\b/i,
      /\bgovernare l['’]?AI\b/i,
      /\bAI audit\b/i,
      /\baudit AI\b/i,
      /\bIPR AI Audit Trail\b/i,
      /\bmodel governance\b/i,
      /\bgovernance modelli\b/i,
      /\bmodelli AI esterni\b/i,
      /\bexternal AI models\b/i,
      /\bOpenAI\b/i,
      /\bAnthropic\b/i,
      /\bClaude\b/i,
      /\bGoogle AI\b/i,
      /\bGemini\b/i,
      /\bMeta AI\b/i,
      /\bLlama\b/i,
      /\bMistral\b/i,
      /\bMATRIX AI GOVERNANCE\b/i,
      /\bruntime AI governato\b/i,
      /\bruntime governato AI\b/i
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
  ...DEMOCRATIC_CHOICE_RULES,
  ...CRITICAL_OPERATIONAL_RULES,
  ...CIVIC_SENSITIVE_RULES,
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
  CIVIC_SENSITIVE: 6,
  DEMOCRATIC_CHOICE: 7,
  SECURITY_SENSITIVE: 8,
  CRITICAL_OPERATIONAL: 9,
  SECRET: 10,
  UNSUPPORTED: 11
};

export function classifyData(input: DataClassifierInput): DataClassification {
  const combined = normalizeInput(input);

  if (!combined.trim()) {
    return {
      dataClass: "UNKNOWN",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: ["No text, file name, MIME type or route context was provided."]
    };
  }

  const matchedRules = findMatchedRules(combined);
  const dataClass = selectHighestDataClass(matchedRules);

  const containsSecret = matchedRules.some((rule) => rule.dataClass === "SECRET");

  const containsPersonalData = matchedRules.some(
    (rule) => rule.dataClass === "PERSONAL"
  );

  const containsCivicSensitiveData = matchedRules.some(
    (rule) => rule.dataClass === "CIVIC_SENSITIVE"
  );

  const containsDemocraticChoiceData = matchedRules.some(
    (rule) => rule.dataClass === "DEMOCRATIC_CHOICE"
  );

  const containsSecuritySensitiveData = matchedRules.some((rule) =>
    [
      "SENSITIVE",
      "CIVIC_SENSITIVE",
      "DEMOCRATIC_CHOICE",
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
    containsCivicSensitiveData,
    containsDemocraticChoiceData,
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

export function isDemocraticChoiceData(
  classification: DataClassification
): boolean {
  return (
    classification.dataClass === "DEMOCRATIC_CHOICE" ||
    Boolean(classification.containsDemocraticChoiceData)
  );
}

export function isCivicSensitiveData(
  classification: DataClassification
): boolean {
  return (
    classification.dataClass === "CIVIC_SENSITIVE" ||
    classification.dataClass === "DEMOCRATIC_CHOICE" ||
    Boolean(classification.containsCivicSensitiveData) ||
    Boolean(classification.containsDemocraticChoiceData)
  );
}

export function requiresDataMinimization(
  classification: DataClassification
): boolean {
  return [
    "CONFIDENTIAL",
    "SENSITIVE",
    "PERSONAL",
    "CIVIC_SENSITIVE",
    "DEMOCRATIC_CHOICE",
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
    "CIVIC_SENSITIVE",
    "DEMOCRATIC_CHOICE",
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
    classification.dataClass === "UNSUPPORTED" ||
    classification.dataClass === "DEMOCRATIC_CHOICE"
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
    }`,
    `Contains civic-sensitive data: ${
      classification.containsCivicSensitiveData ? "yes" : "no"
    }`,
    `Contains democratic-choice data: ${
      classification.containsDemocraticChoiceData ? "yes" : "no"
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
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "No sensitive data pattern matched.",
        "Input appears to be ordinary public documentation or non-sensitive text.",
        "Data classified as PUBLIC."
      ]
    };
  }

  if (looksLikeSafeHbceAiGovernanceText(combined)) {
    return {
      dataClass: "INTERNAL",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "No sensitive data pattern matched.",
        "Input appears to be HBCE ECOSISTEMA AI, AI governance, model governance or AI audit context.",
        "Data classified as INTERNAL because it is project/runtime context, not secret or personal data."
      ]
    };
  }

  if (input.fileName || input.mimeType) {
    return {
      dataClass: "INTERNAL",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
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
    containsCivicSensitiveData: false,
    containsDemocraticChoiceData: false,
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
    /\bpublic documentation\b/i.test(combined) ||
    /\bdocumentation\b/i.test(combined) ||
    /\bdocs\//i.test(combined) ||
    /\boverview\b/i.test(combined) ||
    /\btemplate\b/i.test(combined) ||
    /\bchecklist\b/i.test(combined) ||
    /\broadmap\b/i.test(combined);

  const hasNoSensitiveIndicators = ![
    ...SECRET_RULES,
    ...UNSUPPORTED_RULES,
    ...DEMOCRATIC_CHOICE_RULES,
    ...CRITICAL_OPERATIONAL_RULES,
    ...CIVIC_SENSITIVE_RULES,
    ...PERSONAL_RULES,
    ...SECURITY_SENSITIVE_RULES,
    ...CONFIDENTIAL_RULES,
    ...SENSITIVE_RULES
  ].some((rule) => rule.patterns.some((pattern) => pattern.test(combined)));

  return hasNoSensitiveIndicators && (safeFile || publicWords);
}

function looksLikeSafeHbceAiGovernanceText(combined: string): boolean {
  const hasHbceAiGovernance =
    /\bHBCE ECOSISTEMA AI\b/i.test(combined) ||
    /\becosistema AI\b/i.test(combined) ||
    /\bAI governance\b/i.test(combined) ||
    /\bgovernance AI\b/i.test(combined) ||
    /\bAI audit\b/i.test(combined) ||
    /\bIPR AI Audit Trail\b/i.test(combined) ||
    /\bmodel governance\b/i.test(combined) ||
    /\bOpenAI\b/i.test(combined) ||
    /\bAnthropic\b/i.test(combined) ||
    /\bClaude\b/i.test(combined) ||
    /\bGoogle AI\b/i.test(combined) ||
    /\bGemini\b/i.test(combined) ||
    /\bMeta AI\b/i.test(combined) ||
    /\bLlama\b/i.test(combined) ||
    /\bMistral\b/i.test(combined) ||
    /\bMATRIX AI GOVERNANCE\b/i.test(combined);

  const hasSensitiveIndicators = [
    ...SECRET_RULES,
    ...UNSUPPORTED_RULES,
    ...DEMOCRATIC_CHOICE_RULES,
    ...CRITICAL_OPERATIONAL_RULES,
    ...CIVIC_SENSITIVE_RULES,
    ...PERSONAL_RULES,
    ...SECURITY_SENSITIVE_RULES,
    ...CONFIDENTIAL_RULES,
    ...SENSITIVE_RULES
  ].some((rule) => rule.patterns.some((pattern) => pattern.test(combined)));

  return hasHbceAiGovernance && !hasSensitiveIndicators;
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
