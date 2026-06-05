import {
  findDocumentProfilesForRecallFromDatabase,
  listDocumentProfilesFromDatabase,
  toPublicDocumentProfile
} from "@/lib/ipr-database";
import type { DocumentProfileDatabaseRow } from "@/lib/ipr-database";

export const CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION =
  "HBCE-CYBERNETIC-DOCUMENT-RECALL-ENGINE-v5-STRICT_REQUESTED_MEMORY_ONLY-HBCE_AI_ECOSYSTEM_PROFILE_SUMMARY_HARD_REPAIR-v5_5-USE_PROFILE_SUMMARY_HARD_REPAIR-v5_6-USE_VOLUME_II_PROFILE_SUMMARY_HARD_REPAIR-v5_7-USE_VOLUME_III_PROFILE_SUMMARY_HARD_REPAIR-v5_8-USE_VOLUME_IV_PROFILE_SUMMARY_HARD_REPAIR-v5_9-USE_VOLUME_V_PROFILE_SUMMARY_HARD_REPAIR-v5_10";

const HBCE_AI_ECOSYSTEM_PROFILE_SUMMARY_HARD_REPAIR_REVISION =
  "HBCE_AI_ECOSYSTEM_PROFILE_SUMMARY_HARD_REPAIR-v5_5";
const USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION =
  "USE_PROFILE_SUMMARY_HARD_REPAIR-v5_6-USE_VOLUME_II_PROFILE_SUMMARY_HARD_REPAIR-v5_7-USE_VOLUME_III_PROFILE_SUMMARY_HARD_REPAIR-v5_8-USE_VOLUME_IV_PROFILE_SUMMARY_HARD_REPAIR-v5_9-USE_VOLUME_V_PROFILE_SUMMARY_HARD_REPAIR-v5_10";
const USE_EUROPEAN_FEDERATION_VOLUME_II_PROFILE_SUMMARY_HARD_REPAIR_REVISION =
  "USE_VOLUME_II_PROFILE_SUMMARY_HARD_REPAIR-v5_7";
const USE_EUROPEAN_FEDERATION_VOLUME_III_PROFILE_SUMMARY_HARD_REPAIR_REVISION =
  "USE_VOLUME_III_PROFILE_SUMMARY_HARD_REPAIR-v5_8";
const USE_EUROPEAN_FEDERATION_VOLUME_IV_PROFILE_SUMMARY_HARD_REPAIR_REVISION =
  "USE_VOLUME_IV_PROFILE_SUMMARY_HARD_REPAIR-v5_9";
const USE_EUROPEAN_FEDERATION_VOLUME_V_PROFILE_SUMMARY_HARD_REPAIR_REVISION =
  "USE_VOLUME_V_PROFILE_SUMMARY_HARD_REPAIR-v5_10";
const HBCE_AI_ECOSYSTEM_VOLUME_I_PROFILE_ID = "DOC-PROFILE-8602A2F8D2E2494D";
const HBCE_AI_ECOSYSTEM_VOLUME_I_MEMORY_ID = "IPR-MEM-20260604124905-E968EDC7";
const HBCE_AI_ECOSYSTEM_VOLUME_I_FILE_HASH =
  "sha256:8c439b38f884a7bc5e1ace66575dff4968f7d7929701487eac81f13fb3eda79a";
const HBCE_AI_ECOSYSTEM_VOLUME_I_FILENAME = "1A.HBCE_ECOSISTEMA_AI_PULITO.txt";
const HBCE_AI_ECOSYSTEM_VOLUME_I_TITLE = "HBCE ECOSISTEMA AI";
const HBCE_AI_ECOSYSTEM_VOLUME_I_SUBTITLE =
  "Architettura operativa per intelligenze artificiali verificabili, responsabili e governate";
const HBCE_AI_ECOSYSTEM_VOLUME_I_CANONICAL_SUMMARY =
  "HBCE ECOSISTEMA AI Volume I definisce l’architettura fondativa per intelligenze artificiali verificabili, responsabili e governate tramite IPR, EVT, OPC, MATRIX, AI JOKER-C2, governance operativa, audit, responsabilità tracciabile e logica fail-closed.";
const HBCE_AI_ECOSYSTEM_VOLUME_I_CANONICAL_AXIS =
  "AI · HBCE · IPR · EVT · OPC · MATRIX · JOKER-C2 · Governance · Audit · Responsibility";
const HBCE_AI_ECOSYSTEM_VOLUME_I_KEY_TERMS = [
  "HBCE ECOSISTEMA AI",
  "HBCE AI Ecosystem",
  "Volume I",
  "AI governance",
  "Governance operativa",
  "Intelligenza artificiale governata",
  "AI verificabile",
  "IPR",
  "Identity Primary Record",
  "Identità operativa",
  "EVT",
  "Evento verificabile",
  "OPC",
  "Prova operativa",
  "MATRIX",
  "AI JOKER-C2",
  "Audit",
  "Responsabilità verificabile",
  "Fail-closed",
  "B2B",
  "B2G",
  "AI Act",
  "Compliance",
  "Document Memory",
  "Runtime governance"
];
const HBCE_AI_ECOSYSTEM_VOLUME_II_PROFILE_ID = "DOC-PROFILE-995E764E5A3E6E40";
const HBCE_AI_ECOSYSTEM_VOLUME_II_MEMORY_ID = "IPR-MEM-20260604142520-C4EA1D92";
const HBCE_AI_ECOSYSTEM_VOLUME_II_FILE_HASH =
  "sha256:f966e296f48109c595ac4e39b97467338b354b8bf62f29dbef4b3107f2a1699e";
const HBCE_AI_ECOSYSTEM_VOLUME_II_FILENAME = "HBCE_ECOSISTEMA_AI_VOLUME_II_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const HBCE_AI_ECOSYSTEM_VOLUME_II_TITLE = "HBCE ECOSISTEMA AI";
const HBCE_AI_ECOSYSTEM_VOLUME_II_SUBTITLE =
  "IPR — Protocollo di Identità Operativa per Sistemi AI";
const HBCE_AI_ECOSYSTEM_VOLUME_II_CANONICAL_AXIS =
  "IPR · Identity Primary Record · Identità operativa · EVT · OPC · Audit · Registro · Verifica · Derivazione · Continuità";
const HBCE_AI_ECOSYSTEM_VOLUME_II_CANONICAL_SUMMARY =
  "HBCE ECOSISTEMA AI Volume II definisce l’IPR come protocollo di identità operativa per sistemi AI, descrivendo struttura, record, payload, hash, timestamp, stati, derivazioni, validazione, minimizzazione dati, registro, ricevuta, verifica, ciclo di vita e continuità auditabile.";
const HBCE_AI_ECOSYSTEM_VOLUME_II_KEY_TERMS = [
  "HBCE ECOSISTEMA AI",
  "HBCE AI Ecosystem",
  "Volume II",
  "IPR",
  "Identity Primary Record",
  "Protocollo IPR",
  "Identità operativa",
  "Record IPR",
  "Payload",
  "Hash",
  "Timestamp",
  "Stati operativi",
  "Derivazione IPR",
  "Validazione",
  "Minimizzazione dati",
  "Registro IPR",
  "Ricevuta IPR",
  "Verification Gateway",
  "Ciclo di vita",
  "Audit",
  "EVT",
  "OPC",
  "AI JOKER-C2",
  "Continuità auditabile"
];
const HBCE_AI_ECOSYSTEM_VOLUME_III_PROFILE_ID = "DOC-PROFILE-5F5E13FD403BE684";
const HBCE_AI_ECOSYSTEM_VOLUME_III_MEMORY_ID = "IPR-MEM-20260604145636-F91B2203";
const HBCE_AI_ECOSYSTEM_VOLUME_III_FILE_HASH =
  "sha256:b32bcc740955ec6a2c98b292ed5f44332e111605e9f5d015834d73406c80e8c1";
const HBCE_AI_ECOSYSTEM_VOLUME_III_FILENAME = "HBCE_ECOSISTEMA_AI_VOLUME_III_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const HBCE_AI_ECOSYSTEM_VOLUME_III_TITLE = "HBCE ECOSISTEMA AI";
const HBCE_AI_ECOSYSTEM_VOLUME_III_SUBTITLE =
  "Industrializzazione, audit operativo e adozione dello standard HBCE";
const HBCE_AI_ECOSYSTEM_VOLUME_III_CANONICAL_AXIS =
  "Adoption · Industrialization · Audit · Fascicolo operativo AI · HBCE-M · HBCE-L · IPR AI Audit Trail · Pilot · Market · Standard · EVT · OPC";
const HBCE_AI_ECOSYSTEM_VOLUME_III_CANONICAL_SUMMARY =
  "HBCE ECOSISTEMA AI Volume III definisce il passaggio da architettura a sistema adottabile, industrializzabile e misurabile, introducendo fascicolo operativo AI, audit-by-design, metriche HBCE, livelli HBCE-L, prodotto IPR AI Audit Trail, onboarding, pilot, documentazione organizzativa, casi d’uso e roadmap verso standard operativo replicabile.";
const HBCE_AI_ECOSYSTEM_VOLUME_III_KEY_TERMS = [
  "HBCE ECOSISTEMA AI",
  "HBCE AI Ecosystem",
  "Volume III",
  "Industrializzazione",
  "Adozione",
  "Audit operativo",
  "Audit-by-design",
  "Fascicolo operativo AI",
  "HBCE-M",
  "HBCE-L",
  "IPR AI Audit Trail",
  "Metriche HBCE",
  "Pilot",
  "Onboarding",
  "Mercato",
  "Standard operativo",
  "RACI",
  "Documentazione organizzativa",
  "Casi d’uso",
  "Roadmap",
  "EVT",
  "OPC",
  "AI JOKER-C2",
  "Verificabilità"
];
const HBCE_AI_ECOSYSTEM_VOLUME_IV_PROFILE_ID = "DOC-PROFILE-9BB76910F2A96526";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_MEMORY_ID = "IPR-MEM-20260604154950-F111F7E2";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_FILE_HASH =
  "sha256:ac5e69982ef0b29d9639e48d4a791f0f0ac9aeeea2602994ca34d846633eaab2";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_FILENAME = "HBCE_ECOSISTEMA_AI_VOLUME_IV_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_TITLE = "HBCE ECOSISTEMA AI";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_MODULE = "HBCE_ECOSISTEMA_AI_VOLUME_IV";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_CLASSIFICATION =
  "HBCE_AI_ECOSYSTEM_OPERATIONAL_OFFICE_EVIDENCE_CHAIN_VOLUME";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_SUBTITLE =
  "L’Ufficio Operativo dell’Intelligenza Artificiale";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_CANONICAL_AXIS =
  "Pratica · Operatore · Input · Evento · Hash · OPC · Verifica · Archivio · Responsabilità";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_OPERATIONAL_TRACE_AXIS =
  "Practice · Operator · Input · Event · Hash · EVT · OPC · Verification · Archive · Evidence · Anomaly · Incident Review · Responsibility";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_CANONICAL_SUMMARY =
  "HBCE ECOSISTEMA AI Volume IV definisce il livello tecnico-probatorio dell’ecosistema HBCE: l’Ufficio Operativo dell’Intelligenza Artificiale, la trasformazione della risposta AI in pratica verificabile, la catena EVT/OPC, gli hash, l’audit trail, il fascicolo operativo, le anomalie, l’incident review, la minimizzazione della prova, la sicurezza LLM, l’Evidence Pack e i limiti di non certificazione pubblica automatica.";
const HBCE_AI_ECOSYSTEM_VOLUME_IV_KEY_TERMS = [
  "HBCE ECOSISTEMA AI",
  "HBCE AI Ecosystem",
  "Volume IV",
  "Ufficio Operativo dell’Intelligenza Artificiale",
  "Pratica verificabile",
  "Operatore HBCE",
  "EVT",
  "Event Verifiable Trace",
  "OPC",
  "Operational Proof & Compliance",
  "Catena EVT/OPC",
  "Hash",
  "Audit trail",
  "Fascicolo operativo",
  "Anomalie",
  "Incident review",
  "Evidence Pack",
  "Minimizzazione della prova",
  "Sicurezza LLM",
  "Prompt injection",
  "Data disclosure",
  "Retention",
  "Access control",
  "Responsabilità tecnica",
  "Non certificazione pubblica automatica"
];

const HBCE_AI_ECOSYSTEM_VOLUME_V_PROFILE_ID = "DOC-PROFILE-973154390367A735";
const HBCE_AI_ECOSYSTEM_VOLUME_V_MEMORY_ID = "IPR-MEM-20260604162417-C5AB96FD";
const HBCE_AI_ECOSYSTEM_VOLUME_V_FILE_HASH =
  "sha256:d4c582cd0afa691423774c5c0fa531eda3b1923f3ec34ade398735e8abd58eab";
const HBCE_AI_ECOSYSTEM_VOLUME_V_FILENAME = "HBCE_ECOSISTEMA_AI_VOLUME_V_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const HBCE_AI_ECOSYSTEM_VOLUME_V_TITLE = "HBCE ECOSISTEMA AI";
const HBCE_AI_ECOSYSTEM_VOLUME_V_MODULE = "HBCE_ECOSISTEMA_AI_VOLUME_V";
const HBCE_AI_ECOSYSTEM_VOLUME_V_CLASSIFICATION =
  "HBCE_AI_ECOSYSTEM_FEDERATED_AI_NETWORK_VOLUME";
const HBCE_AI_ECOSYSTEM_VOLUME_V_SUBTITLE =
  "LA RETE FEDERATA DELL’INTELLIGENZA ARTIFICIALE";
const HBCE_AI_ECOSYSTEM_VOLUME_V_CANONICAL_AXIS =
  "Nodo · Registro · Fiducia · Interoperabilità · Federazione · Sovranità · Continuità";
const HBCE_AI_ECOSYSTEM_VOLUME_V_OPERATIONAL_TRACE_AXIS =
  "Node · Registry · Trust · Interoperability · Federation · Sovereignty · Continuity · Trust-State · Cross-Registry Verification · Revocation · HBCE-F";
const HBCE_AI_ECOSYSTEM_VOLUME_V_CANONICAL_SUMMARY =
  "HBCE ECOSISTEMA AI Volume V definisce la rete federata dell’intelligenza artificiale: il passaggio da sistema governato interno a infrastruttura federata esterna, fondata su nodi HBCE, registri federati, Trust Fabric, Trust-State, cross-registry verification, interoperabilità tra sistemi AI, AI supply chain, federazione pubblico-privata, revoca, quarantena, sovranità digitale, continuità operativa e standard HBCE-F.";
const HBCE_AI_ECOSYSTEM_VOLUME_V_KEY_TERMS = [
  "HBCE ECOSISTEMA AI",
  "HBCE AI Ecosystem",
  "Volume V",
  "Rete federata dell’intelligenza artificiale",
  "Nodo",
  "Registro",
  "Fiducia",
  "Interoperabilità",
  "Federazione",
  "Sovranità",
  "Continuità",
  "HBCE-F",
  "Trust Fabric",
  "Trust-State",
  "Cross-registry verification",
  "Registri federati",
  "Nodi HBCE",
  "AI interoperability",
  "AI supply chain",
  "Public-private federation",
  "Revoca",
  "Quarantena",
  "Sovranità digitale",
  "Operational continuity",
  "Standard operativo europeo"
];

const USE_VOLUME_I_PROFILE_ID = "DOC-PROFILE-64123DA2E40C78D7";
const USE_VOLUME_I_MEMORY_ID = "IPR-MEM-20260604183547-CC615C10";
const USE_VOLUME_I_FILE_HASH =
  "sha256:c3f9bad057dcab6baeaa232e447697d10e28c3417d873072ec5e473756826ebf";
const USE_VOLUME_I_FILENAME = "USE_VOLUME_I_EMERGENZA_EUROPEA_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const USE_VOLUME_I_TITLE = "U.S.E. - Emergenza Europea";
const USE_VOLUME_I_SUBTITLE =
  "Protezione civile, sicurezza operativa e continuità istituzionale dagli enti regionali alla federazione europea";
const USE_VOLUME_I_MODULE = "USE_EMERGENZA_EUROPEA_VOLUME_I";
const USE_VOLUME_I_CLASSIFICATION = "USE_EUROPEAN_EMERGENCY_CIVIL_PROTECTION_VOLUME";
const USE_VOLUME_I_CANONICAL_AXIS =
  "Emergenza · Coordinamento · Verifica · Continuità · Federazione";
const USE_VOLUME_I_OPERATIONAL_TRACE_AXIS =
  "Territory · Region · State · European Union · International Cooperation · Civil Protection · Critical Infrastructure · Operational Identity · Responsibility · Audit · Institutional Continuity · EVT · OPC";
const USE_VOLUME_I_CANONICAL_SUMMARY =
  "U.S.E. Volume I definisce l’emergenza europea come fondamento operativo degli Stati Uniti d’Europa: la protezione civile federata, la sicurezza civile, la continuità istituzionale, la protezione delle infrastrutture critiche, la cybersecurity, l’energia, la sanità e MATRIX come architettura di coordinamento verificabile tra territorio, Regione, Stato, Unione Europea e livello internazionale.";
const USE_VOLUME_I_OPERATIONAL_MEMORY_SUMMARY =
  "U.S.E. Volume I è il volume Emergenza Europea del ciclo United States of Europe. Definisce emergenza, coordinamento, verifica, continuità istituzionale e federazione come catena operativa attraverso cui la protezione civile diventa il primo atto concreto di una federazione europea verificabile.";
const USE_VOLUME_I_KEY_TERMS = [
  "U.S.E.",
  "United States of Europe",
  "Volume I",
  "Emergenza Europea",
  "Protezione civile federata",
  "Sicurezza civile",
  "Continuità istituzionale",
  "Federazione operativa europea",
  "Emergenza",
  "Coordinamento",
  "Verifica",
  "Continuità",
  "Federazione",
  "Regione",
  "Stato",
  "Unione Europea",
  "Cooperazione internazionale",
  "Infrastrutture critiche",
  "Cybersecurity",
  "Energia",
  "Sanità",
  "MATRIX",
  "IPR",
  "EVT",
  "OPC",
  "Audit",
  "Fail-closed"
];

const USE_VOLUME_II_PROFILE_ID = "DOC-PROFILE-DCB2F7C8BEAE4EE8";
const USE_VOLUME_II_MEMORY_ID = "IPR-MEM-20260605074421-0EC12CFA";
const USE_VOLUME_II_FILE_HASH =
  "sha256:aca5b87333b0d550d67a7eb61f83d46a5419c453b3a5e3d4362b1804ab816063";
const USE_VOLUME_II_FILENAME = "USE_VOLUME_II_FEDERAZIONE_OPERATIVA_EUROPEA_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const USE_VOLUME_II_TITLE = "U.S.E. - Federazione Operativa Europea";
const USE_VOLUME_II_SUBTITLE =
  "Dal mercato unico al sistema federato di esecuzione istituzionale";
const USE_VOLUME_II_MODULE = "USE_FEDERAZIONE_OPERATIVA_EUROPEA_VOLUME_II";
const USE_VOLUME_II_CLASSIFICATION = "USE_EUROPEAN_OPERATIONAL_FEDERATION_VOLUME";
const USE_VOLUME_II_CANONICAL_AXIS =
  "Regolazione · Decisione · Esecuzione · Verifica · Continuità federale";
const USE_VOLUME_II_OPERATIONAL_TRACE_AXIS =
  "Decisione federale · esecuzione istituzionale · responsabilità multilivello · interoperabilità · audit pubblico · continuità amministrativa · identità operativa europea · Regione · Stato · Unione Europea · cittadino · MATRIX · IPR · EVT · OPC · fail-closed";
const USE_VOLUME_II_CANONICAL_SUMMARY =
  "U.S.E. Volume II definisce la Federazione Operativa Europea come passaggio dall’Europa regolatoria a un sistema federato capace di decisione, esecuzione, verifica e continuità: identità operativa europea, catena decisionale federata, esecuzione multilivello, eventi verificabili, MATRIX come protocollo federale, audit pubblico, fail-closed istituzionale e domini concreti di esecuzione federale.";
const USE_VOLUME_II_OPERATIONAL_MEMORY_SUMMARY =
  "U.S.E. Volume II è il volume Federazione Operativa Europea del ciclo United States of Europe. Trasforma la necessità federale emersa nell’emergenza in architettura istituzionale permanente fondata su decisione federale, esecuzione multilivello, verifica, audit pubblico, fail-closed e continuità federale.";
const USE_VOLUME_II_KEY_TERMS = [
  "U.S.E.",
  "United States of Europe",
  "Volume II",
  "Federazione Operativa Europea",
  "Europa regolatoria",
  "Regolazione",
  "Decisione",
  "Esecuzione",
  "Verifica",
  "Continuità federale",
  "Decisione federale",
  "Esecuzione istituzionale",
  "Responsabilità multilivello",
  "Interoperabilità",
  "Audit pubblico",
  "Continuità amministrativa",
  "Identità operativa europea",
  "Regione",
  "Stato",
  "Unione Europea",
  "Cittadino federale",
  "MATRIX",
  "IPR",
  "EVT",
  "OPC",
  "Fail-closed"
];

const USE_VOLUME_III_PROFILE_ID = "DOC-PROFILE-46788B076362ED33";
const USE_VOLUME_III_MEMORY_ID = "IPR-MEM-20260605104016-EB512DC1";
const USE_VOLUME_III_FILE_HASH =
  "sha256:465e629f8ad45ad9aae3ea0d88f4e9e7146e554befcfe809cb609e9d810aa0d7";
const USE_VOLUME_III_RUNTIME_VARIANT_FILE_HASH =
  "sha256:ca4628729ccff44df9b8bbc7d21c9a490a6a977bf102400a1a4e97e7d778d1c5";
const USE_VOLUME_III_FILENAME = "USE_VOLUME_III_VOTO_DIGITALE_FEDERATO_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const USE_VOLUME_III_RUNTIME_VARIANT_FILENAME =
  "USE_VOLUME_III_VOTO_DIGITALE_FEDERATO_CLEAN_RUNTIME_FOR_JOKER_C2-1.txt";
const USE_VOLUME_III_TITLE = "U.S.E. - Voto Digitale Federato";
const USE_VOLUME_III_SUBTITLE =
  "Referendum multilivello, rete politica federata e sovranità popolare europea";
const USE_VOLUME_III_MODULE = "USE_VOTO_DIGITALE_FEDERATO_VOLUME_III";
const USE_VOLUME_III_CLASSIFICATION = "USE_EUROPEAN_FEDERATED_DIGITAL_VOTE_VOLUME";
const USE_VOLUME_III_CANONICAL_AXIS =
  "Cittadino · Quesito · Voto · Verifica · Decisione pubblica federata";
const USE_VOLUME_III_OPERATIONAL_TRACE_AXIS =
  "Rete politica federata · Referendum multilivello · Cittadino deliberante · Sovranità popolare europea · Leggi concrete · Quesiti pubblici · Decisioni territoriali · Decisioni regionali · Decisioni nazionali · Decisioni europee · Identità operativa democratica · Segretezza della scelta · Audit pubblico · Integrità democratica · Fail-closed democratico · Continuità istituzionale · MATRIX · IPR · EVT · OPC · AI_JOKER_C2_OPERATIONAL_STACK";
const USE_VOLUME_III_CANONICAL_SUMMARY =
  "U.S.E. Volume III definisce il Voto Digitale Federato come infrastruttura democratica multilivello degli Stati Uniti d’Europa: referendum territoriali, regionali, nazionali ed europei, cittadino deliberante, quesiti pubblici, segretezza della scelta, verifica del processo, audit pubblico, fail-closed democratico e decisione pubblica federata.";
const USE_VOLUME_III_OPERATIONAL_MEMORY_SUMMARY =
  "U.S.E. Volume III è il volume Voto Digitale Federato del ciclo United States of Europe. Trasforma la federazione operativa in democrazia verificabile attraverso referendum multilivello, identità democratica, quesiti pubblici, voto segreto, audit pubblico, fail-closed democratico e decisione pubblica federata.";
const USE_VOLUME_III_KEY_TERMS = [
  "U.S.E.",
  "United States of Europe",
  "Volume III",
  "Voto Digitale Federato",
  "Referendum multilivello",
  "Rete politica federata",
  "Cittadino deliberante",
  "Sovranità popolare europea",
  "Leggi concrete",
  "Quesiti pubblici",
  "Decisioni territoriali",
  "Decisioni regionali",
  "Decisioni nazionali",
  "Decisioni europee",
  "Identità operativa democratica",
  "Segretezza della scelta",
  "Audit pubblico",
  "Integrità democratica",
  "Fail-closed democratico",
  "Continuità istituzionale",
  "MATRIX",
  "IPR",
  "EVT",
  "OPC",
  "Decisione pubblica federata"
];

const USE_VOLUME_IV_PROFILE_ID = "DOC-PROFILE-3ADB6D0995C0F0C9";
const USE_VOLUME_IV_MEMORY_ID = "IPR-MEM-20260605115145-7E74253D";
const USE_VOLUME_IV_FILE_HASH =
  "sha256:4512fbc2fbf7e45e5b6f842fbcc6f33f88158be8c52ac10ac86a69dffc7af34d";
const USE_VOLUME_IV_RUNTIME_VARIANT_FILE_HASH =
  "sha256:f5ffb57bdb550f5477db26d5f66eaa4bc4dd8591699aec720c425a09aff51584";
const USE_VOLUME_IV_FILENAME = "USE_VOLUME_IV_SOVRANITA_DIGITALE_EUROPEA_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const USE_VOLUME_IV_TITLE = "U.S.E. - Sovranità Digitale Europea";
const USE_VOLUME_IV_SUBTITLE =
  "AI, cybersecurity, dati, cloud, energia, infrastrutture critiche e stack HBCE";
const USE_VOLUME_IV_MODULE = "USE_SOVRANITA_DIGITALE_EUROPEA_VOLUME_IV";
const USE_VOLUME_IV_CLASSIFICATION = "USE_EUROPEAN_DIGITAL_SOVEREIGNTY_VOLUME";
const USE_VOLUME_IV_CANONICAL_AXIS =
  "Dati · Identità · Infrastruttura · Sicurezza · Sovranità digitale";
const USE_VOLUME_IV_OPERATIONAL_TRACE_AXIS =
  "AI · cybersecurity · dati · cloud · identità operativa · energia · infrastrutture critiche · industria strategica · sovranità digitale · continuità istituzionale · autonomia europea · audit · MATRIX · HBCE · UNEBDO · MetaExchange · OPC · IOspace · CyberGlobal · NeuroLoop · fail-closed";
const USE_VOLUME_IV_CANONICAL_SUMMARY =
  "U.S.E. Volume IV definisce la Sovranità Digitale Europea come condizione materiale della Federazione Operativa Europea e della democrazia federata: dati controllabili, identità protetta, AI governabile, cybersecurity federata, cloud europeo, energia resiliente, infrastrutture critiche, stack HBCE dimostrativo, audit, continuità istituzionale e fail-closed.";
const USE_VOLUME_IV_OPERATIONAL_MEMORY_SUMMARY =
  "U.S.E. Volume IV è il volume Sovranità Digitale Europea del ciclo United States of Europe. Trasforma la democrazia digitale federata in infrastruttura digitale sovrana fondata su dati controllabili, identità protetta, AI governabile, cybersecurity, cloud, energia, infrastrutture critiche, stack HBCE, audit, continuità e fail-closed.";
const USE_VOLUME_IV_KEY_TERMS = [
  "U.S.E.",
  "United States of Europe",
  "Volume IV",
  "Sovranità Digitale Europea",
  "Dati controllabili",
  "Identità protetta",
  "AI governabile",
  "Cybersecurity federata",
  "Cloud europeo",
  "Energia resiliente",
  "Infrastrutture critiche",
  "Industria strategica",
  "Autonomia europea",
  "Continuità istituzionale",
  "MATRIX",
  "HBCE",
  "UNEBDO",
  "MetaExchange",
  "OPC",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "Audit pubblico",
  "Fail-closed",
  "Sovranità digitale"
];

const USE_VOLUME_V_PROFILE_ID = "DOC-PROFILE-B5297AA7385C6AB1";
const USE_VOLUME_V_MEMORY_ID = "IPR-MEM-20260605125852-732DB35A";
const USE_VOLUME_V_FILE_HASH =
  "sha256:64a072215a794cb17b988d0384103cc5a27e538bde542ca9011cff7e357a4309";
const USE_VOLUME_V_FILENAME = "USE_VOLUME_V_COSTITUZIONE_OPERATIVA_EUROPEA_CLEAN_RUNTIME_FOR_JOKER_C2.txt";
const USE_VOLUME_V_TITLE = "U.S.E. - Costituzione Operativa Europea";
const USE_VOLUME_V_SUBTITLE = "Protocollo federale verificabile per il XXI secolo";
const USE_VOLUME_V_MODULE = "USE_COSTITUZIONE_OPERATIVA_EUROPEA_VOLUME_V";
const USE_VOLUME_V_CLASSIFICATION = "USE_EUROPEAN_OPERATIONAL_CONSTITUTION_VOLUME";
const USE_VOLUME_V_CANONICAL_AXIS =
  "Emergenza · Federazione · Voto · Sovranità digitale · Costituzione operativa";
const USE_VOLUME_V_OPERATIONAL_TRACE_AXIS =
  "Costituzione operativa · protocollo federale · identità operativa · voto digitale federato · sovranità digitale · protezione civile · sicurezza civile · AI governata · cybersecurity · energia · infrastrutture critiche · MATRIX · HBCE · audit pubblico · fail-closed · continuità istituzionale";
const USE_VOLUME_V_CANONICAL_SUMMARY =
  "U.S.E. Volume V definisce la Costituzione Operativa Europea come chiusura del ciclo United States of Europe: emergenza, federazione, voto e sovranità digitale vengono trasformati in protocollo federale verificabile per proteggere, decidere, votare, eseguire, verificare e continuare come federazione operativa.";
const USE_VOLUME_V_OPERATIONAL_MEMORY_SUMMARY =
  "U.S.E. Volume V è il volume Costituzione Operativa Europea del ciclo United States of Europe. Chiude la sequenza federale trasformando emergenza, federazione operativa, voto digitale federato e sovranità digitale in protocollo costituzionale verificabile per protezione, decisione, voto, esecuzione, audit e continuità.";
const USE_VOLUME_V_KEY_TERMS = [
  "U.S.E.",
  "United States of Europe",
  "Volume V",
  "Costituzione Operativa Europea",
  "Protocollo federale verificabile",
  "Identità operativa",
  "Voto digitale federato",
  "Sovranità digitale",
  "Protezione civile",
  "Sicurezza civile",
  "AI governata",
  "Cybersecurity",
  "Energia",
  "Infrastrutture critiche",
  "MATRIX",
  "HBCE",
  "Audit pubblico",
  "Fail-closed",
  "Continuità istituzionale",
  "EVT",
  "OPC",
  "Costituzione operativa"
];

export type CyberneticDocumentFileSnapshot = {
  name?: string | null;
  filename?: string | null;
};

export type CyberneticDocumentRecallPolicyMode =
  | "STRICT"
  | "PARTIAL_ALLOWED"
  | "FAIL_CLOSED_ON_MISSING";

export type CyberneticDocumentProjectContext = {
  projectId?: string | null;
  projectKey?: string | null;
  projectName?: string | null;
  documentModuleId?: string | null;
  documentModuleName?: string | null;
  docFamily?: string | null;
};

export type CyberneticDocumentRecallConfig = {
  projectContext?: CyberneticDocumentProjectContext | null;
  policyMode?: CyberneticDocumentRecallPolicyMode | null;
  maxDocumentCount?: number | null;
  promptMaxChars?: number | null;
  allowedDocFamilies?: string[] | null;
  requireVerifiedIpr?: boolean | null;
  requireTenantScope?: boolean | null;
  requireWorkspaceScope?: boolean | null;
  requireProjectScope?: boolean | null;
  allowCrossTenantRecall?: boolean | null;
  allowCrossWorkspaceRecall?: boolean | null;
  allowCrossProjectRecall?: boolean | null;
  failClosedOnMissingRequestedIds?: boolean | null;
  orderedRecall?: boolean | null;
};

type ResolvedCyberneticDocumentRecallConfig = {
  projectContext: Required<Pick<CyberneticDocumentProjectContext, "projectId" | "projectKey" | "projectName" | "documentModuleId" | "documentModuleName" | "docFamily">>;
  policyMode: CyberneticDocumentRecallPolicyMode;
  maxDocumentCount: number;
  promptMaxChars: number | null;
  allowedDocFamilies: string[];
  requireVerifiedIpr: boolean;
  requireTenantScope: boolean;
  requireWorkspaceScope: boolean;
  requireProjectScope: boolean;
  allowCrossTenantRecall: boolean;
  allowCrossWorkspaceRecall: boolean;
  allowCrossProjectRecall: boolean;
  failClosedOnMissingRequestedIds: boolean;
  orderedRecall: boolean;
};

type CyberneticDocumentRecallIsolationReport = {
  tenantScoped: boolean;
  workspaceScoped: boolean;
  projectScoped: boolean;
  docFamilyScoped: boolean;
  rejectedByTenant: number;
  rejectedByWorkspace: number;
  rejectedByProject: number;
  rejectedByDocFamily: number;
};

export type CyberneticDocumentProfileRecallItem = {
  profileId: string | null;
  profileKeyHash: string | null;
  fileId: string | null;
  filename: string | null;
  fileHash: string | null;
  docFamily: string | null;
  volume: string | null;
  title: string | null;
  subtitle: string | null;
  canonicalAxis: string | null;
  summary: string | null;
  keyTerms: string[];
  semanticTerms: unknown[];
  memoryId: string | null;
  sourceSavedChatId: string | null;
  lastEvtId: string | null;
  lastOpcProofId: string | null;
  textStatus: string | null;
  textLength: number | null;
  mimeType: string | null;
  quality: string | null;
  reusableInPrompt: boolean;
  recallScore: number | null;
  profileStatus: string | null;
  updatedAt: string | null;
  publicProfile: Record<string, unknown>;
  legalCertification: false;
};

export type CyberneticDocumentProfileRecall = {
  enabled: boolean;
  injected: boolean;
  status:
    | "DOCUMENT_PROFILE_RECALL_INJECTED"
    | "DOCUMENT_PROFILE_RECALL_EMPTY"
    | "DOCUMENT_PROFILE_RECALL_FAIL_CLOSED"
    | "DOCUMENT_PROFILE_RECALL_QUERY_FAILED";
  source: "document_profiles";
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  documentModuleId: string | null;
  sessionId: string;
  query: string;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  strictRequestedMemoryOnly: boolean;
  strictRequestedMemoryFilter:
    | "NO_REQUESTED_MEMORY_ID"
    | "REQUESTED_MEMORY_ID_APPLIED"
    | "REQUESTED_MEMORY_ID_NOT_FOUND";
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  requestedProjectId: string | null;
  requestedDocumentModuleId: string | null;
  recallPolicyMode: CyberneticDocumentRecallPolicyMode;
  maxDocumentCount: number;
  allowedDocFamilies: string[];
  missingMemoryIds: string[];
  missingProfileIds: string[];
  failClosed: boolean;
  failClosedReason: string | null;
  isolation: CyberneticDocumentRecallIsolationReport;
  items: CyberneticDocumentProfileRecallItem[];
  profileIds: string[];
  memoryIds: string[];
  promptBlock: string;
  error: string | null;
  legalCertification: false;
};

type CyberneticHandoffContext = {
  humanIpr?: string | null;
  identityBinding?: string | null;
};

type CyberneticSaasContext = {
  tenantId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  documentModuleId?: string | null;
};

type CyberneticIprRecallItem = {
  memoryId?: string | null;
  memoryTitle?: string | null;
  memorySummary?: string | null;
  classification?: string | null;
  quality?: string | null;
  memoryStatus?: string | null;
  sourceThreadId?: string | null;
  sourceSavedChatId?: string | null;
  sessionId?: string | null;
  lastEvtId?: string | null;
  lastOpcProofId?: string | null;
  lastOpcChainHash?: string | null;
};

type CyberneticIprRecallContext = {
  injected: boolean;
  status: string;
  sessionId: string;
  items: CyberneticIprRecallItem[];
  memoryIds: string[];
};

type CyberneticRuntimeMemoryContext = {
  memoryId?: string | null;
};

type CyberneticDocumentMemoryRecallAnswerInput = {
  recall: CyberneticIprRecallContext;
  documentProfileRecall: CyberneticDocumentProfileRecall | null;
  message: string;
  handoff: CyberneticHandoffContext;
  memory: CyberneticRuntimeMemoryContext;
  policy?: unknown;
  saasContext: CyberneticSaasContext;
  projectContext?: CyberneticDocumentProjectContext | null;
  recallConfig?: CyberneticDocumentRecallConfig | null;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function stringFromValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return stringFromValue(error) || "UNKNOWN_ERROR";
}

function truncateCyberneticDocumentPromptBlock(value: string, maxChars: number): string {
  if (!maxChars || maxChars < 1) {
    return "";
  }

  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 96))}\n...[TRUNCATED_CYBERNETIC_DOCUMENT_RECALL_BLOCK]`;
}

const DEFAULT_CYBERNETIC_DOCUMENT_RECALL_MAX_DOCUMENT_COUNT = 8;
const DEFAULT_CYBERNETIC_DOCUMENT_RECALL_PROMPT_MAX_CHARS = 18000;

function normalizeNullableText(value: unknown): string | null {
  const normalized = stringFromValue(value).trim();
  return normalized || null;
}

function normalizeDocumentScopeId(value: unknown): string | null {
  const normalized = normalizeNullableText(value);
  return normalized ? normalized.trim() : null;
}

function normalizeDocumentFamily(value: unknown): string | null {
  const normalized = normalizeNullableText(value);
  return normalized ? normalized.trim().toUpperCase() : null;
}

function normalizeComparableDocumentValue(value: unknown): string {
  return normalizeText(stringFromValue(value));
}

function isMatrixVolumeVContaminatedSummary(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = normalizeText(value);
  return (
    normalized.includes("matrix italia") ||
    normalized.includes("volume v") ||
    normalized.includes("base energetica") ||
    normalized.includes("smr") ||
    normalized.includes("rete energetica europea") ||
    normalized.includes("layer φω") ||
    normalized.includes("layer phi") ||
    normalized.includes("nodi energetici")
  );
}

function isUseEuropeanFederationVolumeVProfileRecord(publicProfile: Record<string, unknown>): boolean {
  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const documentKind = stringFromValue(publicProfile.documentKind).trim().toUpperCase();
  const useCycle = stringFromValue(publicProfile.useCycle).trim().toUpperCase();
  const useVolume = stringFromValue(publicProfile.useVolume).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const title = normalizeComparableDocumentValue(publicProfile.title);
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const classification = stringFromValue(publicProfile.classification).trim().toUpperCase();
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === USE_VOLUME_V_PROFILE_ID ||
    memoryId === USE_VOLUME_V_MEMORY_ID ||
    fileHash === USE_VOLUME_V_FILE_HASH ||
    filename === normalizeText(USE_VOLUME_V_FILENAME) ||
    module === USE_VOLUME_V_MODULE ||
    classification === USE_VOLUME_V_CLASSIFICATION ||
    (docFamily === "USE_EUROPEAN_FEDERATION" && documentKind === "USE_VOLUME" && (volume === "V5" || useVolume === "V5")) ||
    (useCycle === "UNITED_STATES_OF_EUROPE" && (volume === "V5" || useVolume === "V5")) ||
    title === normalizeText(USE_VOLUME_V_TITLE) ||
    subtitle === normalizeText(USE_VOLUME_V_SUBTITLE) ||
    canonicalAxis === normalizeText(USE_VOLUME_V_CANONICAL_AXIS) ||
    summary.includes("u.s.e. volume v") ||
    summary.includes("costituzione operativa europea") ||
    summary.includes("protocollo federale verificabile") ||
    summary.includes("costituzione operativa") ||
    summary.includes("voto digitale federato") ||
    summary.includes("sovranita digitale") ||
    summary.includes("sovranità digitale") ||
    summary.includes("continuita istituzionale") ||
    summary.includes("continuità istituzionale")
  );
}

function isUseEuropeanFederationVolumeIVProfileRecord(publicProfile: Record<string, unknown>): boolean {
  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const documentKind = stringFromValue(publicProfile.documentKind).trim().toUpperCase();
  const useCycle = stringFromValue(publicProfile.useCycle).trim().toUpperCase();
  const useVolume = stringFromValue(publicProfile.useVolume).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const title = normalizeComparableDocumentValue(publicProfile.title);
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const classification = stringFromValue(publicProfile.classification).trim().toUpperCase();
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === USE_VOLUME_IV_PROFILE_ID ||
    memoryId === USE_VOLUME_IV_MEMORY_ID ||
    fileHash === USE_VOLUME_IV_FILE_HASH ||
    fileHash === USE_VOLUME_IV_RUNTIME_VARIANT_FILE_HASH ||
    filename === normalizeText(USE_VOLUME_IV_FILENAME) ||
    module === USE_VOLUME_IV_MODULE ||
    classification === USE_VOLUME_IV_CLASSIFICATION ||
    (docFamily === "USE_EUROPEAN_FEDERATION" && documentKind === "USE_VOLUME" && (volume === "V4" || useVolume === "V4")) ||
    (useCycle === "UNITED_STATES_OF_EUROPE" && (volume === "V4" || useVolume === "V4")) ||
    title === normalizeText(USE_VOLUME_IV_TITLE) ||
    subtitle === normalizeText(USE_VOLUME_IV_SUBTITLE) ||
    canonicalAxis === normalizeText(USE_VOLUME_IV_CANONICAL_AXIS) ||
    summary.includes("u.s.e. volume iv") ||
    summary.includes("sovranita digitale europea") ||
    summary.includes("sovranità digitale europea") ||
    summary.includes("dati controllabili") ||
    summary.includes("ai governabile") ||
    summary.includes("cybersecurity federata") ||
    summary.includes("cloud europeo") ||
    summary.includes("infrastrutture critiche") ||
    summary.includes("stack hbce")
  );
}

function isUseEuropeanFederationVolumeIIIProfileRecord(publicProfile: Record<string, unknown>): boolean {
  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const documentKind = stringFromValue(publicProfile.documentKind).trim().toUpperCase();
  const useCycle = stringFromValue(publicProfile.useCycle).trim().toUpperCase();
  const useVolume = stringFromValue(publicProfile.useVolume).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const title = normalizeComparableDocumentValue(publicProfile.title);
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const classification = stringFromValue(publicProfile.classification).trim().toUpperCase();
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === USE_VOLUME_III_PROFILE_ID ||
    memoryId === USE_VOLUME_III_MEMORY_ID ||
    fileHash === USE_VOLUME_III_FILE_HASH ||
    fileHash === USE_VOLUME_III_RUNTIME_VARIANT_FILE_HASH ||
    filename === normalizeText(USE_VOLUME_III_FILENAME) ||
    filename === normalizeText(USE_VOLUME_III_RUNTIME_VARIANT_FILENAME) ||
    module === USE_VOLUME_III_MODULE ||
    classification === USE_VOLUME_III_CLASSIFICATION ||
    (docFamily === "USE_EUROPEAN_FEDERATION" && documentKind === "USE_VOLUME" && (volume === "V3" || useVolume === "V3")) ||
    (useCycle === "UNITED_STATES_OF_EUROPE" && (volume === "V3" || useVolume === "V3")) ||
    title === normalizeText(USE_VOLUME_III_TITLE) ||
    subtitle === normalizeText(USE_VOLUME_III_SUBTITLE) ||
    canonicalAxis === normalizeText(USE_VOLUME_III_CANONICAL_AXIS) ||
    summary.includes("u.s.e. volume iii") ||
    summary.includes("voto digitale federato") ||
    summary.includes("referendum multilivello") ||
    summary.includes("cittadino deliberante") ||
    summary.includes("decisione pubblica federata") ||
    summary.includes("segretezza della scelta") ||
    summary.includes("fail-closed democratico")
  );
}

function isUseEuropeanFederationVolumeIProfileRecord(publicProfile: Record<string, unknown>): boolean {
  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const documentKind = stringFromValue(publicProfile.documentKind).trim().toUpperCase();
  const useCycle = stringFromValue(publicProfile.useCycle).trim().toUpperCase();
  const useVolume = stringFromValue(publicProfile.useVolume).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const title = normalizeComparableDocumentValue(publicProfile.title);
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const classification = stringFromValue(publicProfile.classification).trim().toUpperCase();
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === USE_VOLUME_I_PROFILE_ID ||
    memoryId === USE_VOLUME_I_MEMORY_ID ||
    fileHash === USE_VOLUME_I_FILE_HASH ||
    filename === normalizeText(USE_VOLUME_I_FILENAME) ||
    module === USE_VOLUME_I_MODULE ||
    classification === USE_VOLUME_I_CLASSIFICATION ||
    (docFamily === "USE_EUROPEAN_FEDERATION" && documentKind === "USE_VOLUME" && (volume === "V1" || useVolume === "V1")) ||
    (useCycle === "UNITED_STATES_OF_EUROPE" && (volume === "V1" || useVolume === "V1")) ||
    title === normalizeText(USE_VOLUME_I_TITLE) ||
    subtitle === normalizeText(USE_VOLUME_I_SUBTITLE) ||
    canonicalAxis === normalizeText(USE_VOLUME_I_CANONICAL_AXIS) ||
    summary.includes("u.s.e. volume i") ||
    summary.includes("emergenza europea") ||
    summary.includes("protezione civile federata") ||
    summary.includes("stati uniti d'europa") ||
    summary.includes("united states of europe") ||
    summary.includes("emergenza, coordinamento, verifica")
  );
}

function isUseEuropeanFederationVolumeIIProfileRecord(publicProfile: Record<string, unknown>): boolean {
  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const documentKind = stringFromValue(publicProfile.documentKind).trim().toUpperCase();
  const useCycle = stringFromValue(publicProfile.useCycle).trim().toUpperCase();
  const useVolume = stringFromValue(publicProfile.useVolume).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const title = normalizeComparableDocumentValue(publicProfile.title);
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const classification = stringFromValue(publicProfile.classification).trim().toUpperCase();
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === USE_VOLUME_II_PROFILE_ID ||
    memoryId === USE_VOLUME_II_MEMORY_ID ||
    fileHash === USE_VOLUME_II_FILE_HASH ||
    filename === normalizeText(USE_VOLUME_II_FILENAME) ||
    module === USE_VOLUME_II_MODULE ||
    classification === USE_VOLUME_II_CLASSIFICATION ||
    (docFamily === "USE_EUROPEAN_FEDERATION" && documentKind === "USE_VOLUME" && (volume === "V2" || useVolume === "V2")) ||
    (useCycle === "UNITED_STATES_OF_EUROPE" && (volume === "V2" || useVolume === "V2")) ||
    title === normalizeText(USE_VOLUME_II_TITLE) ||
    subtitle === normalizeText(USE_VOLUME_II_SUBTITLE) ||
    canonicalAxis === normalizeText(USE_VOLUME_II_CANONICAL_AXIS) ||
    summary.includes("u.s.e. volume ii") ||
    summary.includes("federazione operativa europea") ||
    summary.includes("europa regolatoria") ||
    summary.includes("decisione, esecuzione, verifica") ||
    summary.includes("continuita federale") ||
    summary.includes("regolazione, decisione, esecuzione")
  );
}

function isNoActiveFileMemorySummary(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = normalizeText(value);
  return (
    normalized.includes("ipr_canonical_document_memory_blocked") ||
    normalized.includes("sourceDocument=NO_ACTIVE_FILE".toLowerCase()) ||
    normalized.includes("sourceDocument=no_active_file".toLowerCase()) ||
    normalized.includes("no_active_file") ||
    normalized.includes("failreason=no_active_file") ||
    normalized.includes("quantum_memory_collapse_blocked")
  );
}

function withUseEuropeanFederationVolumeICanonicalProfileRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  const previousDocFamily = documentProfileString(publicProfile, "docFamily");
  const previousDocumentKind = documentProfileString(publicProfile, "documentKind");
  const previousTitle = documentProfileString(publicProfile, "title");
  const previousVolume = documentProfileString(publicProfile, "volume");
  const previousUseVolume = documentProfileString(publicProfile, "useVolume");
  const previousSubtitle = documentProfileString(publicProfile, "subtitle");
  const previousCanonicalAxis = documentProfileString(publicProfile, "canonicalAxis");
  const previousSummary = documentProfileString(publicProfile, "summary");
  const previousSummaryBlocked = isNoActiveFileMemorySummary(previousSummary);
  const repairApplied =
    previousDocFamily !== "USE_EUROPEAN_FEDERATION" ||
    previousDocumentKind !== "USE_VOLUME" ||
    previousTitle !== USE_VOLUME_I_TITLE ||
    previousVolume !== "V1" ||
    previousUseVolume !== "V1" ||
    previousSubtitle !== USE_VOLUME_I_SUBTITLE ||
    previousCanonicalAxis !== USE_VOLUME_I_CANONICAL_AXIS ||
    previousSummary !== USE_VOLUME_I_CANONICAL_SUMMARY ||
    previousSummaryBlocked;

  return {
    ...publicProfile,
    docFamily: "USE_EUROPEAN_FEDERATION",
    documentKind: "USE_VOLUME",
    useCycle: "UNITED_STATES_OF_EUROPE",
    useVolume: "V1",
    volume: "V1",
    module: USE_VOLUME_I_MODULE,
    title: USE_VOLUME_I_TITLE,
    subtitle: USE_VOLUME_I_SUBTITLE,
    classification: USE_VOLUME_I_CLASSIFICATION,
    quality: "CANONICAL",
    canonicalAxis: USE_VOLUME_I_CANONICAL_AXIS,
    operationalTraceAxis: USE_VOLUME_I_OPERATIONAL_TRACE_AXIS,
    summary: USE_VOLUME_I_CANONICAL_SUMMARY,
    keyTerms: USE_VOLUME_I_KEY_TERMS,
    semanticTerms: USE_VOLUME_I_KEY_TERMS,
    useEuropeanFederationProfileSummaryHardRepairApplied: repairApplied,
    useEuropeanFederationProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    useEuropeanFederationProfileSummaryHardRepairVolume: "V1",
    preRepairDocFamily: previousDocFamily || "NO_PRE_REPAIR_DOC_FAMILY",
    preRepairDocumentKind: previousDocumentKind || "NO_PRE_REPAIR_DOCUMENT_KIND",
    preRepairTitle: previousTitle || "NO_PRE_REPAIR_TITLE",
    preRepairVolume: previousVolume || "NO_PRE_REPAIR_VOLUME",
    preRepairUseVolume: previousUseVolume || "NO_PRE_REPAIR_USE_VOLUME",
    preRepairSubtitle: previousSubtitle || "NO_PRE_REPAIR_SUBTITLE",
    preRepairCanonicalAxis: previousCanonicalAxis || "NO_PRE_REPAIR_CANONICAL_AXIS",
    preRepairSummary: previousSummary || "NO_PRE_REPAIR_SUMMARY",
    preRepairNoActiveFileSummaryDetected: previousSummaryBlocked,
    useProfileSummaryDetected: true,
    summaryContaminationDetected: false,
    expectedSummary: USE_VOLUME_I_CANONICAL_SUMMARY,
    actualSummary: USE_VOLUME_I_CANONICAL_SUMMARY
  };
}

function withUseEuropeanFederationVolumeIICanonicalProfileRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  const previousDocFamily = documentProfileString(publicProfile, "docFamily");
  const previousDocumentKind = documentProfileString(publicProfile, "documentKind");
  const previousTitle = documentProfileString(publicProfile, "title");
  const previousVolume = documentProfileString(publicProfile, "volume");
  const previousUseVolume = documentProfileString(publicProfile, "useVolume");
  const previousSubtitle = documentProfileString(publicProfile, "subtitle");
  const previousCanonicalAxis = documentProfileString(publicProfile, "canonicalAxis");
  const previousSummary = documentProfileString(publicProfile, "summary");
  const previousSummaryBlocked = isNoActiveFileMemorySummary(previousSummary);
  const repairApplied =
    previousDocFamily !== "USE_EUROPEAN_FEDERATION" ||
    previousDocumentKind !== "USE_VOLUME" ||
    previousTitle !== USE_VOLUME_II_TITLE ||
    previousVolume !== "V2" ||
    previousUseVolume !== "V2" ||
    previousSubtitle !== USE_VOLUME_II_SUBTITLE ||
    previousCanonicalAxis !== USE_VOLUME_II_CANONICAL_AXIS ||
    previousSummary !== USE_VOLUME_II_CANONICAL_SUMMARY ||
    previousSummaryBlocked;

  return {
    ...publicProfile,
    docFamily: "USE_EUROPEAN_FEDERATION",
    documentKind: "USE_VOLUME",
    useCycle: "UNITED_STATES_OF_EUROPE",
    useVolume: "V2",
    volume: "V2",
    module: USE_VOLUME_II_MODULE,
    title: USE_VOLUME_II_TITLE,
    subtitle: USE_VOLUME_II_SUBTITLE,
    classification: USE_VOLUME_II_CLASSIFICATION,
    quality: "CANONICAL",
    canonicalAxis: USE_VOLUME_II_CANONICAL_AXIS,
    operationalTraceAxis: USE_VOLUME_II_OPERATIONAL_TRACE_AXIS,
    summary: USE_VOLUME_II_CANONICAL_SUMMARY,
    keyTerms: USE_VOLUME_II_KEY_TERMS,
    semanticTerms: USE_VOLUME_II_KEY_TERMS,
    useEuropeanFederationProfileSummaryHardRepairApplied: repairApplied,
    useEuropeanFederationProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    useEuropeanFederationProfileSummaryHardRepairVolume: "V2",
    useEuropeanFederationVolumeIIProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_VOLUME_II_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    preRepairDocFamily: previousDocFamily || "NO_PRE_REPAIR_DOC_FAMILY",
    preRepairDocumentKind: previousDocumentKind || "NO_PRE_REPAIR_DOCUMENT_KIND",
    preRepairTitle: previousTitle || "NO_PRE_REPAIR_TITLE",
    preRepairVolume: previousVolume || "NO_PRE_REPAIR_VOLUME",
    preRepairUseVolume: previousUseVolume || "NO_PRE_REPAIR_USE_VOLUME",
    preRepairSubtitle: previousSubtitle || "NO_PRE_REPAIR_SUBTITLE",
    preRepairCanonicalAxis: previousCanonicalAxis || "NO_PRE_REPAIR_CANONICAL_AXIS",
    preRepairSummary: previousSummary || "NO_PRE_REPAIR_SUMMARY",
    preRepairNoActiveFileSummaryDetected: previousSummaryBlocked,
    useProfileSummaryDetected: true,
    summaryContaminationDetected: false,
    expectedSummary: USE_VOLUME_II_CANONICAL_SUMMARY,
    actualSummary: USE_VOLUME_II_CANONICAL_SUMMARY
  };
}

function withUseEuropeanFederationVolumeIIICanonicalProfileRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  const previousDocFamily = documentProfileString(publicProfile, "docFamily");
  const previousDocumentKind = documentProfileString(publicProfile, "documentKind");
  const previousTitle = documentProfileString(publicProfile, "title");
  const previousVolume = documentProfileString(publicProfile, "volume");
  const previousUseVolume = documentProfileString(publicProfile, "useVolume");
  const previousSubtitle = documentProfileString(publicProfile, "subtitle");
  const previousCanonicalAxis = documentProfileString(publicProfile, "canonicalAxis");
  const previousSummary = documentProfileString(publicProfile, "summary");
  const previousSummaryBlocked = isNoActiveFileMemorySummary(previousSummary);
  const repairApplied =
    previousDocFamily !== "USE_EUROPEAN_FEDERATION" ||
    previousDocumentKind !== "USE_VOLUME" ||
    previousTitle !== USE_VOLUME_III_TITLE ||
    previousVolume !== "V3" ||
    previousUseVolume !== "V3" ||
    previousSubtitle !== USE_VOLUME_III_SUBTITLE ||
    previousCanonicalAxis !== USE_VOLUME_III_CANONICAL_AXIS ||
    previousSummary !== USE_VOLUME_III_CANONICAL_SUMMARY ||
    previousSummaryBlocked;

  return {
    ...publicProfile,
    docFamily: "USE_EUROPEAN_FEDERATION",
    documentKind: "USE_VOLUME",
    useCycle: "UNITED_STATES_OF_EUROPE",
    useVolume: "V3",
    volume: "V3",
    module: USE_VOLUME_III_MODULE,
    title: USE_VOLUME_III_TITLE,
    subtitle: USE_VOLUME_III_SUBTITLE,
    classification: USE_VOLUME_III_CLASSIFICATION,
    quality: "CANONICAL",
    canonicalAxis: USE_VOLUME_III_CANONICAL_AXIS,
    operationalTraceAxis: USE_VOLUME_III_OPERATIONAL_TRACE_AXIS,
    summary: USE_VOLUME_III_CANONICAL_SUMMARY,
    keyTerms: USE_VOLUME_III_KEY_TERMS,
    semanticTerms: USE_VOLUME_III_KEY_TERMS,
    useEuropeanFederationProfileSummaryHardRepairApplied: repairApplied,
    useEuropeanFederationProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    useEuropeanFederationProfileSummaryHardRepairVolume: "V3",
    useEuropeanFederationVolumeIIIProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_VOLUME_III_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    preRepairDocFamily: previousDocFamily || "NO_PRE_REPAIR_DOC_FAMILY",
    preRepairDocumentKind: previousDocumentKind || "NO_PRE_REPAIR_DOCUMENT_KIND",
    preRepairTitle: previousTitle || "NO_PRE_REPAIR_TITLE",
    preRepairVolume: previousVolume || "NO_PRE_REPAIR_VOLUME",
    preRepairUseVolume: previousUseVolume || "NO_PRE_REPAIR_USE_VOLUME",
    preRepairSubtitle: previousSubtitle || "NO_PRE_REPAIR_SUBTITLE",
    preRepairCanonicalAxis: previousCanonicalAxis || "NO_PRE_REPAIR_CANONICAL_AXIS",
    preRepairSummary: previousSummary || "NO_PRE_REPAIR_SUMMARY",
    preRepairNoActiveFileSummaryDetected: previousSummaryBlocked,
    useProfileSummaryDetected: true,
    summaryContaminationDetected: false,
    expectedSummary: USE_VOLUME_III_CANONICAL_SUMMARY,
    actualSummary: USE_VOLUME_III_CANONICAL_SUMMARY
  };
}

function withUseEuropeanFederationVolumeVCanonicalProfileRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  const previousDocFamily = documentProfileString(publicProfile, "docFamily");
  const previousDocumentKind = documentProfileString(publicProfile, "documentKind");
  const previousTitle = documentProfileString(publicProfile, "title");
  const previousVolume = documentProfileString(publicProfile, "volume");
  const previousUseVolume = documentProfileString(publicProfile, "useVolume");
  const previousSubtitle = documentProfileString(publicProfile, "subtitle");
  const previousCanonicalAxis = documentProfileString(publicProfile, "canonicalAxis");
  const previousSummary = documentProfileString(publicProfile, "summary");
  const previousSummaryBlocked = isNoActiveFileMemorySummary(previousSummary);
  const repairApplied =
    previousDocFamily !== "USE_EUROPEAN_FEDERATION" ||
    previousDocumentKind !== "USE_VOLUME" ||
    previousTitle !== USE_VOLUME_V_TITLE ||
    previousVolume !== "V5" ||
    previousUseVolume !== "V5" ||
    previousSubtitle !== USE_VOLUME_V_SUBTITLE ||
    previousCanonicalAxis !== USE_VOLUME_V_CANONICAL_AXIS ||
    previousSummary !== USE_VOLUME_V_CANONICAL_SUMMARY ||
    previousSummaryBlocked;

  return {
    ...publicProfile,
    docFamily: "USE_EUROPEAN_FEDERATION",
    documentKind: "USE_VOLUME",
    useCycle: "UNITED_STATES_OF_EUROPE",
    useVolume: "V5",
    volume: "V5",
    module: USE_VOLUME_V_MODULE,
    title: USE_VOLUME_V_TITLE,
    subtitle: USE_VOLUME_V_SUBTITLE,
    classification: USE_VOLUME_V_CLASSIFICATION,
    quality: "CANONICAL",
    canonicalAxis: USE_VOLUME_V_CANONICAL_AXIS,
    operationalTraceAxis: USE_VOLUME_V_OPERATIONAL_TRACE_AXIS,
    summary: USE_VOLUME_V_CANONICAL_SUMMARY,
    keyTerms: USE_VOLUME_V_KEY_TERMS,
    semanticTerms: USE_VOLUME_V_KEY_TERMS,
    useEuropeanFederationProfileSummaryHardRepairApplied: repairApplied,
    useEuropeanFederationProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    useEuropeanFederationProfileSummaryHardRepairVolume: "V5",
    useEuropeanFederationVolumeVProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_VOLUME_V_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    preRepairDocFamily: previousDocFamily || "NO_PRE_REPAIR_DOC_FAMILY",
    preRepairDocumentKind: previousDocumentKind || "NO_PRE_REPAIR_DOCUMENT_KIND",
    preRepairTitle: previousTitle || "NO_PRE_REPAIR_TITLE",
    preRepairVolume: previousVolume || "NO_PRE_REPAIR_VOLUME",
    preRepairUseVolume: previousUseVolume || "NO_PRE_REPAIR_USE_VOLUME",
    preRepairSubtitle: previousSubtitle || "NO_PRE_REPAIR_SUBTITLE",
    preRepairCanonicalAxis: previousCanonicalAxis || "NO_PRE_REPAIR_CANONICAL_AXIS",
    preRepairSummary: previousSummary || "NO_PRE_REPAIR_SUMMARY",
    preRepairNoActiveFileSummaryDetected: previousSummaryBlocked,
    useProfileSummaryDetected: true,
    summaryContaminationDetected: false,
    expectedSummary: USE_VOLUME_V_CANONICAL_SUMMARY,
    actualSummary: USE_VOLUME_V_CANONICAL_SUMMARY
  };
}

function withUseEuropeanFederationVolumeIVCanonicalProfileRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  const previousDocFamily = documentProfileString(publicProfile, "docFamily");
  const previousDocumentKind = documentProfileString(publicProfile, "documentKind");
  const previousTitle = documentProfileString(publicProfile, "title");
  const previousVolume = documentProfileString(publicProfile, "volume");
  const previousUseVolume = documentProfileString(publicProfile, "useVolume");
  const previousSubtitle = documentProfileString(publicProfile, "subtitle");
  const previousCanonicalAxis = documentProfileString(publicProfile, "canonicalAxis");
  const previousSummary = documentProfileString(publicProfile, "summary");
  const previousSummaryBlocked = isNoActiveFileMemorySummary(previousSummary);
  const repairApplied =
    previousDocFamily !== "USE_EUROPEAN_FEDERATION" ||
    previousDocumentKind !== "USE_VOLUME" ||
    previousTitle !== USE_VOLUME_IV_TITLE ||
    previousVolume !== "V4" ||
    previousUseVolume !== "V4" ||
    previousSubtitle !== USE_VOLUME_IV_SUBTITLE ||
    previousCanonicalAxis !== USE_VOLUME_IV_CANONICAL_AXIS ||
    previousSummary !== USE_VOLUME_IV_CANONICAL_SUMMARY ||
    previousSummaryBlocked;

  return {
    ...publicProfile,
    docFamily: "USE_EUROPEAN_FEDERATION",
    documentKind: "USE_VOLUME",
    useCycle: "UNITED_STATES_OF_EUROPE",
    useVolume: "V4",
    volume: "V4",
    module: USE_VOLUME_IV_MODULE,
    title: USE_VOLUME_IV_TITLE,
    subtitle: USE_VOLUME_IV_SUBTITLE,
    classification: USE_VOLUME_IV_CLASSIFICATION,
    quality: "CANONICAL",
    canonicalAxis: USE_VOLUME_IV_CANONICAL_AXIS,
    operationalTraceAxis: USE_VOLUME_IV_OPERATIONAL_TRACE_AXIS,
    summary: USE_VOLUME_IV_CANONICAL_SUMMARY,
    keyTerms: USE_VOLUME_IV_KEY_TERMS,
    semanticTerms: USE_VOLUME_IV_KEY_TERMS,
    useEuropeanFederationProfileSummaryHardRepairApplied: repairApplied,
    useEuropeanFederationProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    useEuropeanFederationProfileSummaryHardRepairVolume: "V4",
    useEuropeanFederationVolumeIVProfileSummaryHardRepairRevision: USE_EUROPEAN_FEDERATION_VOLUME_IV_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    preRepairDocFamily: previousDocFamily || "NO_PRE_REPAIR_DOC_FAMILY",
    preRepairDocumentKind: previousDocumentKind || "NO_PRE_REPAIR_DOCUMENT_KIND",
    preRepairTitle: previousTitle || "NO_PRE_REPAIR_TITLE",
    preRepairVolume: previousVolume || "NO_PRE_REPAIR_VOLUME",
    preRepairUseVolume: previousUseVolume || "NO_PRE_REPAIR_USE_VOLUME",
    preRepairSubtitle: previousSubtitle || "NO_PRE_REPAIR_SUBTITLE",
    preRepairCanonicalAxis: previousCanonicalAxis || "NO_PRE_REPAIR_CANONICAL_AXIS",
    preRepairSummary: previousSummary || "NO_PRE_REPAIR_SUMMARY",
    preRepairNoActiveFileSummaryDetected: previousSummaryBlocked,
    useProfileSummaryDetected: true,
    summaryContaminationDetected: false,
    expectedSummary: USE_VOLUME_IV_CANONICAL_SUMMARY,
    actualSummary: USE_VOLUME_IV_CANONICAL_SUMMARY
  };
}

function withUseEuropeanFederationProfileSummaryHardRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  if (isUseEuropeanFederationVolumeVProfileRecord(publicProfile)) {
    return withUseEuropeanFederationVolumeVCanonicalProfileRepair(publicProfile);
  }

  if (isUseEuropeanFederationVolumeIVProfileRecord(publicProfile)) {
    return withUseEuropeanFederationVolumeIVCanonicalProfileRepair(publicProfile);
  }

  if (isUseEuropeanFederationVolumeIIIProfileRecord(publicProfile)) {
    return withUseEuropeanFederationVolumeIIICanonicalProfileRepair(publicProfile);
  }

  if (isUseEuropeanFederationVolumeIIProfileRecord(publicProfile)) {
    return withUseEuropeanFederationVolumeIICanonicalProfileRepair(publicProfile);
  }

  if (isUseEuropeanFederationVolumeIProfileRecord(publicProfile)) {
    return withUseEuropeanFederationVolumeICanonicalProfileRepair(publicProfile);
  }

  return publicProfile;
}

function useEuropeanFederationProfileSummaryHardRepairLines(item: CyberneticDocumentProfileRecallItem): string[] {
  if (
    !isUseEuropeanFederationVolumeIProfileRecord(item.publicProfile || {}) &&
    !isUseEuropeanFederationVolumeIIProfileRecord(item.publicProfile || {}) &&
    !isUseEuropeanFederationVolumeIIIProfileRecord(item.publicProfile || {}) &&
    !isUseEuropeanFederationVolumeIVProfileRecord(item.publicProfile || {}) &&
    !isUseEuropeanFederationVolumeVProfileRecord(item.publicProfile || {})
  ) {
    return [];
  }

  return [
    `useSummaryRepairRevision: ${stringFromValue(item.publicProfile.useEuropeanFederationProfileSummaryHardRepairRevision) || USE_EUROPEAN_FEDERATION_PROFILE_SUMMARY_HARD_REPAIR_REVISION}`,
    `useSummaryRepairApplied: ${String(booleanFromPublicProfile(item.publicProfile.useEuropeanFederationProfileSummaryHardRepairApplied))}`,
    `useSummaryRepairVolume: ${stringFromValue(item.publicProfile.useEuropeanFederationProfileSummaryHardRepairVolume) || item.volume || "UNKNOWN_VOLUME"}`,
    `preRepairDocFamily: ${stringFromValue(item.publicProfile.preRepairDocFamily) || "NO_PRE_REPAIR_DOC_FAMILY"}`,
    `preRepairDocumentKind: ${stringFromValue(item.publicProfile.preRepairDocumentKind) || "NO_PRE_REPAIR_DOCUMENT_KIND"}`,
    `preRepairTitle: ${stringFromValue(item.publicProfile.preRepairTitle) || "NO_PRE_REPAIR_TITLE"}`,
    `preRepairVolume: ${stringFromValue(item.publicProfile.preRepairVolume) || "NO_PRE_REPAIR_VOLUME"}`,
    `preRepairUseVolume: ${stringFromValue(item.publicProfile.preRepairUseVolume) || "NO_PRE_REPAIR_USE_VOLUME"}`,
    `preRepairCanonicalAxis: ${stringFromValue(item.publicProfile.preRepairCanonicalAxis) || "NO_PRE_REPAIR_CANONICAL_AXIS"}`,
    `preRepairNoActiveFileSummaryDetected: ${String(booleanFromPublicProfile(item.publicProfile.preRepairNoActiveFileSummaryDetected))}`,
    `useProfileSummaryDetected: ${String(booleanFromPublicProfile(item.publicProfile.useProfileSummaryDetected))}`
  ];
}

function isHbceAiEcosystemVolumeVProfileRecord(publicProfile: Record<string, unknown>): boolean {
  if (
    isUseEuropeanFederationVolumeIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIIIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIVProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeVProfileRecord(publicProfile)
  ) {
    return false;
  }

  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const ecosystemVolume = stringFromValue(publicProfile.ecosystemVolume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === HBCE_AI_ECOSYSTEM_VOLUME_V_PROFILE_ID ||
    memoryId === HBCE_AI_ECOSYSTEM_VOLUME_V_MEMORY_ID ||
    fileHash === HBCE_AI_ECOSYSTEM_VOLUME_V_FILE_HASH ||
    filename === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_V_FILENAME) ||
    module === "HBCE_ECOSISTEMA_AI_VOLUME_V" ||
    (docFamily === "HBCE_AI_ECOSYSTEM" && (volume === "V5" || ecosystemVolume === "V5")) ||
    subtitle === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_V_SUBTITLE) ||
    canonicalAxis === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_V_CANONICAL_AXIS) ||
    summary.includes("volume v definisce") ||
    summary.includes("rete federata dell’intelligenza artificiale") ||
    summary.includes("rete federata dell'intelligenza artificiale") ||
    summary.includes("infrastruttura federata esterna") ||
    summary.includes("trust fabric") ||
    summary.includes("trust-state") ||
    summary.includes("cross-registry verification") ||
    summary.includes("ai supply chain") ||
    summary.includes("hbce-f")
  );
}

function isHbceAiEcosystemVolumeIVProfileRecord(publicProfile: Record<string, unknown>): boolean {
  if (isHbceAiEcosystemVolumeVProfileRecord(publicProfile)) {
    return false;
  }

  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const ecosystemVolume = stringFromValue(publicProfile.ecosystemVolume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const canonicalAxis = normalizeComparableDocumentValue(publicProfile.canonicalAxis);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === HBCE_AI_ECOSYSTEM_VOLUME_IV_PROFILE_ID ||
    memoryId === HBCE_AI_ECOSYSTEM_VOLUME_IV_MEMORY_ID ||
    fileHash === HBCE_AI_ECOSYSTEM_VOLUME_IV_FILE_HASH ||
    filename === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_IV_FILENAME) ||
    module === "HBCE_ECOSISTEMA_AI_VOLUME_IV" ||
    (docFamily === "HBCE_AI_ECOSYSTEM" && (volume === "V4" || ecosystemVolume === "V4")) ||
    subtitle === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_IV_SUBTITLE) ||
    canonicalAxis === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_IV_CANONICAL_AXIS) ||
    summary.includes("volume iv definisce") ||
    summary.includes("livello tecnico-probatorio") ||
    summary.includes("ufficio operativo dell’intelligenza artificiale") ||
    summary.includes("ufficio operativo dell'intelligenza artificiale") ||
    summary.includes("catena evt/opc") ||
    summary.includes("evidence pack") ||
    summary.includes("incident review") ||
    summary.includes("non certificazione pubblica automatica")
  );
}

function isHbceAiEcosystemVolumeIIIProfileRecord(publicProfile: Record<string, unknown>): boolean {
  if (
    isHbceAiEcosystemVolumeVProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIVProfileRecord(publicProfile)
  ) {
    return false;
  }

  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const ecosystemVolume = stringFromValue(publicProfile.ecosystemVolume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === HBCE_AI_ECOSYSTEM_VOLUME_III_PROFILE_ID ||
    memoryId === HBCE_AI_ECOSYSTEM_VOLUME_III_MEMORY_ID ||
    fileHash === HBCE_AI_ECOSYSTEM_VOLUME_III_FILE_HASH ||
    filename === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_III_FILENAME) ||
    module === "HBCE_ECOSISTEMA_AI_VOLUME_III" ||
    (docFamily === "HBCE_AI_ECOSYSTEM" && (volume === "V3" || ecosystemVolume === "V3")) ||
    subtitle === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_III_SUBTITLE) ||
    summary.includes("volume iii definisce") ||
    summary.includes("fascicolo operativo ai") ||
    summary.includes("ipr ai audit trail") ||
    summary.includes("audit-by-design") ||
    summary.includes("sistema adottabile") ||
    summary.includes("standard operativo replicabile")
  );
}

function isHbceAiEcosystemVolumeIIProfileRecord(publicProfile: Record<string, unknown>): boolean {
  if (isHbceAiEcosystemVolumeIIIProfileRecord(publicProfile)) {
    return false;
  }

  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const ecosystemVolume = stringFromValue(publicProfile.ecosystemVolume).trim().toUpperCase();
  const module = stringFromValue(publicProfile.module).trim().toUpperCase();
  const subtitle = normalizeComparableDocumentValue(publicProfile.subtitle);
  const summary = normalizeComparableDocumentValue(publicProfile.summary);

  return (
    profileId === HBCE_AI_ECOSYSTEM_VOLUME_II_PROFILE_ID ||
    memoryId === HBCE_AI_ECOSYSTEM_VOLUME_II_MEMORY_ID ||
    fileHash === HBCE_AI_ECOSYSTEM_VOLUME_II_FILE_HASH ||
    filename === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_II_FILENAME) ||
    module === "HBCE_ECOSISTEMA_AI_VOLUME_II" ||
    (docFamily === "HBCE_AI_ECOSYSTEM" && (volume === "V2" || ecosystemVolume === "V2")) ||
    subtitle === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_II_SUBTITLE) ||
    summary.includes("volume ii definisce") ||
    summary.includes("protocollo di identita operativa")
  );
}

function isHbceAiEcosystemVolumeIProfileRecord(publicProfile: Record<string, unknown>): boolean {
  if (
    isHbceAiEcosystemVolumeVProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIVProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIIIProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIIProfileRecord(publicProfile)
  ) {
    return false;
  }

  const profileId = stringFromValue(publicProfile.profileId).toUpperCase();
  const memoryId = stringFromValue(publicProfile.memoryId).toUpperCase();
  const fileHash = stringFromValue(publicProfile.fileHash).trim().toLowerCase();
  const filename = normalizeComparableDocumentValue(publicProfile.filename);
  const docFamily = stringFromValue(publicProfile.docFamily).trim().toUpperCase();
  const volume = stringFromValue(publicProfile.volume).trim().toUpperCase();
  const title = normalizeComparableDocumentValue(publicProfile.title);

  return (
    profileId === HBCE_AI_ECOSYSTEM_VOLUME_I_PROFILE_ID ||
    memoryId === HBCE_AI_ECOSYSTEM_VOLUME_I_MEMORY_ID ||
    fileHash === HBCE_AI_ECOSYSTEM_VOLUME_I_FILE_HASH ||
    filename === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_I_FILENAME) ||
    (docFamily === "HBCE_AI_ECOSYSTEM" && volume === "V1") ||
    (title === normalizeText(HBCE_AI_ECOSYSTEM_VOLUME_I_TITLE) && volume === "V1")
  );
}

function isHbceAiEcosystemVolumeIOrIIOrIIIOrIVOrVProfileRecord(publicProfile: Record<string, unknown>): boolean {
  if (
    isUseEuropeanFederationVolumeIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIIIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIVProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeVProfileRecord(publicProfile)
  ) {
    return false;
  }

  return (
    isHbceAiEcosystemVolumeVProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIVProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIIIProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIIProfileRecord(publicProfile) ||
    isHbceAiEcosystemVolumeIProfileRecord(publicProfile)
  );
}

function withHbceAiEcosystemCanonicalProfileRepair(
  publicProfile: Record<string, unknown>,
  args: {
    volume: "V1" | "V2" | "V3" | "V4" | "V5";
    title: string;
    subtitle: string;
    canonicalAxis: string;
    canonicalSummary: string;
    keyTerms: string[];
    module?: string;
    classification?: string;
    operationalTraceAxis?: string;
  }
): Record<string, unknown> {
  const previousSummary = documentProfileString(publicProfile, "summary");
  const previousVolume = documentProfileString(publicProfile, "volume");
  const previousEcosystemVolume = documentProfileString(publicProfile, "ecosystemVolume");
  const previousSubtitle = documentProfileString(publicProfile, "subtitle");
  const previousCanonicalAxis = documentProfileString(publicProfile, "canonicalAxis");
  const previousSummaryContaminationDetected = isMatrixVolumeVContaminatedSummary(previousSummary);
  const summaryRepairApplied =
    previousSummary !== args.canonicalSummary ||
    previousVolume !== args.volume ||
    previousEcosystemVolume !== args.volume ||
    previousSubtitle !== args.subtitle ||
    previousCanonicalAxis !== args.canonicalAxis;

  return {
    ...publicProfile,
    docFamily: "HBCE_AI_ECOSYSTEM",
    documentKind: "HBCE_AI_ECOSYSTEM_VOLUME",
    ecosystemCycle: "HBCE_ECOSISTEMA_AI",
    ecosystemVolume: args.volume,
    volume: args.volume,
    module: args.module || publicProfile.module,
    title: args.title,
    subtitle: args.subtitle,
    classification: args.classification || publicProfile.classification,
    canonicalAxis: args.canonicalAxis,
    operationalTraceAxis: args.operationalTraceAxis || publicProfile.operationalTraceAxis,
    summary: args.canonicalSummary,
    keyTerms: args.keyTerms,
    semanticTerms: args.keyTerms,
    hbceAiEcosystemProfileSummaryHardRepairApplied: summaryRepairApplied,
    hbceAiEcosystemProfileSummaryHardRepairRevision: HBCE_AI_ECOSYSTEM_PROFILE_SUMMARY_HARD_REPAIR_REVISION,
    hbceAiEcosystemProfileSummaryHardRepairVolume: args.volume,
    preRepairSummary: previousSummary || "NO_PRE_REPAIR_SUMMARY",
    preRepairVolume: previousVolume || "NO_PRE_REPAIR_VOLUME",
    preRepairEcosystemVolume: previousEcosystemVolume || "NO_PRE_REPAIR_ECOSYSTEM_VOLUME",
    preRepairSubtitle: previousSubtitle || "NO_PRE_REPAIR_SUBTITLE",
    preRepairCanonicalAxis: previousCanonicalAxis || "NO_PRE_REPAIR_CANONICAL_AXIS",
    preRepairSummaryContaminationDetected: previousSummaryContaminationDetected,
    preRepairMatrixV5SummaryDetected: previousSummaryContaminationDetected,
    summaryContaminationDetected: false,
    matrixV5SummaryDetected: false,
    hbceAiEcosystemSummaryDetected: true,
    expectedSummary: args.canonicalSummary,
    actualSummary: args.canonicalSummary
  };
}

function withHbceAiEcosystemProfileSummaryHardRepair(
  publicProfile: Record<string, unknown>
): Record<string, unknown> {
  if (
    isUseEuropeanFederationVolumeIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIIIProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeIVProfileRecord(publicProfile) ||
    isUseEuropeanFederationVolumeVProfileRecord(publicProfile)
  ) {
    return publicProfile;
  }

  if (isHbceAiEcosystemVolumeVProfileRecord(publicProfile)) {
    return withHbceAiEcosystemCanonicalProfileRepair(publicProfile, {
      volume: "V5",
      title: HBCE_AI_ECOSYSTEM_VOLUME_V_TITLE,
      subtitle: HBCE_AI_ECOSYSTEM_VOLUME_V_SUBTITLE,
      canonicalAxis: HBCE_AI_ECOSYSTEM_VOLUME_V_CANONICAL_AXIS,
      canonicalSummary: HBCE_AI_ECOSYSTEM_VOLUME_V_CANONICAL_SUMMARY,
      keyTerms: HBCE_AI_ECOSYSTEM_VOLUME_V_KEY_TERMS,
      module: HBCE_AI_ECOSYSTEM_VOLUME_V_MODULE,
      classification: HBCE_AI_ECOSYSTEM_VOLUME_V_CLASSIFICATION,
      operationalTraceAxis: HBCE_AI_ECOSYSTEM_VOLUME_V_OPERATIONAL_TRACE_AXIS
    });
  }

  if (isHbceAiEcosystemVolumeIVProfileRecord(publicProfile)) {
    return withHbceAiEcosystemCanonicalProfileRepair(publicProfile, {
      volume: "V4",
      title: HBCE_AI_ECOSYSTEM_VOLUME_IV_TITLE,
      subtitle: HBCE_AI_ECOSYSTEM_VOLUME_IV_SUBTITLE,
      canonicalAxis: HBCE_AI_ECOSYSTEM_VOLUME_IV_CANONICAL_AXIS,
      canonicalSummary: HBCE_AI_ECOSYSTEM_VOLUME_IV_CANONICAL_SUMMARY,
      keyTerms: HBCE_AI_ECOSYSTEM_VOLUME_IV_KEY_TERMS,
      module: HBCE_AI_ECOSYSTEM_VOLUME_IV_MODULE,
      classification: HBCE_AI_ECOSYSTEM_VOLUME_IV_CLASSIFICATION,
      operationalTraceAxis: HBCE_AI_ECOSYSTEM_VOLUME_IV_OPERATIONAL_TRACE_AXIS
    });
  }

  if (isHbceAiEcosystemVolumeIIIProfileRecord(publicProfile)) {
    return withHbceAiEcosystemCanonicalProfileRepair(publicProfile, {
      volume: "V3",
      title: HBCE_AI_ECOSYSTEM_VOLUME_III_TITLE,
      subtitle: HBCE_AI_ECOSYSTEM_VOLUME_III_SUBTITLE,
      canonicalAxis: HBCE_AI_ECOSYSTEM_VOLUME_III_CANONICAL_AXIS,
      canonicalSummary: HBCE_AI_ECOSYSTEM_VOLUME_III_CANONICAL_SUMMARY,
      keyTerms: HBCE_AI_ECOSYSTEM_VOLUME_III_KEY_TERMS
    });
  }

  if (isHbceAiEcosystemVolumeIIProfileRecord(publicProfile)) {
    return withHbceAiEcosystemCanonicalProfileRepair(publicProfile, {
      volume: "V2",
      title: HBCE_AI_ECOSYSTEM_VOLUME_II_TITLE,
      subtitle: HBCE_AI_ECOSYSTEM_VOLUME_II_SUBTITLE,
      canonicalAxis: HBCE_AI_ECOSYSTEM_VOLUME_II_CANONICAL_AXIS,
      canonicalSummary: HBCE_AI_ECOSYSTEM_VOLUME_II_CANONICAL_SUMMARY,
      keyTerms: HBCE_AI_ECOSYSTEM_VOLUME_II_KEY_TERMS
    });
  }

  if (isHbceAiEcosystemVolumeIProfileRecord(publicProfile)) {
    return withHbceAiEcosystemCanonicalProfileRepair(publicProfile, {
      volume: "V1",
      title: HBCE_AI_ECOSYSTEM_VOLUME_I_TITLE,
      subtitle: HBCE_AI_ECOSYSTEM_VOLUME_I_SUBTITLE,
      canonicalAxis: HBCE_AI_ECOSYSTEM_VOLUME_I_CANONICAL_AXIS,
      canonicalSummary: HBCE_AI_ECOSYSTEM_VOLUME_I_CANONICAL_SUMMARY,
      keyTerms: HBCE_AI_ECOSYSTEM_VOLUME_I_KEY_TERMS
    });
  }

  return publicProfile;
}

function booleanFromPublicProfile(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return normalizeText(value) === "true";
  }

  return false;
}

function hbceAiEcosystemProfileSummaryHardRepairLines(item: CyberneticDocumentProfileRecallItem): string[] {
  if (!isHbceAiEcosystemVolumeIOrIIOrIIIOrIVOrVProfileRecord(item.publicProfile || {})) {
    return [];
  }

  return [
    `summaryRepairRevision: ${stringFromValue(item.publicProfile.hbceAiEcosystemProfileSummaryHardRepairRevision) || HBCE_AI_ECOSYSTEM_PROFILE_SUMMARY_HARD_REPAIR_REVISION}`,
    `summaryRepairApplied: ${String(booleanFromPublicProfile(item.publicProfile.hbceAiEcosystemProfileSummaryHardRepairApplied))}`,
    `summaryRepairVolume: ${stringFromValue(item.publicProfile.hbceAiEcosystemProfileSummaryHardRepairVolume) || item.volume || "UNKNOWN_VOLUME"}`,
    `preRepairVolume: ${stringFromValue(item.publicProfile.preRepairVolume) || "NO_PRE_REPAIR_VOLUME"}`,
    `preRepairEcosystemVolume: ${stringFromValue(item.publicProfile.preRepairEcosystemVolume) || "NO_PRE_REPAIR_ECOSYSTEM_VOLUME"}`,
    `preRepairSubtitle: ${stringFromValue(item.publicProfile.preRepairSubtitle) || "NO_PRE_REPAIR_SUBTITLE"}`,
    `preRepairCanonicalAxis: ${stringFromValue(item.publicProfile.preRepairCanonicalAxis) || "NO_PRE_REPAIR_CANONICAL_AXIS"}`,
    `preRepairSummaryContaminationDetected: ${String(booleanFromPublicProfile(item.publicProfile.preRepairSummaryContaminationDetected))}`,
    `preRepairMatrixV5SummaryDetected: ${String(booleanFromPublicProfile(item.publicProfile.preRepairMatrixV5SummaryDetected))}`,
    `summaryContaminationDetected: ${String(booleanFromPublicProfile(item.publicProfile.summaryContaminationDetected))}`,
    `matrixV5SummaryDetected: ${String(booleanFromPublicProfile(item.publicProfile.matrixV5SummaryDetected))}`,
    `hbceAiEcosystemSummaryDetected: ${String(booleanFromPublicProfile(item.publicProfile.hbceAiEcosystemSummaryDetected))}`,
    `expectedSummary: ${stringFromValue(item.publicProfile.expectedSummary) || item.summary || "NO_EXPECTED_SUMMARY"}`,
    `actualSummary: ${stringFromValue(item.publicProfile.actualSummary) || item.summary || "NO_ACTUAL_SUMMARY"}`
  ];
}

function boundedPositiveInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.min(max, Math.max(min, Math.round(Number(value))));
  }

  return fallback;
}

function mergeCyberneticProjectContext(
  saasContext: CyberneticSaasContext,
  directProjectContext?: CyberneticDocumentProjectContext | null,
  configProjectContext?: CyberneticDocumentProjectContext | null,
  inferredDocFamily?: string | null
): Required<Pick<CyberneticDocumentProjectContext, "projectId" | "projectKey" | "projectName" | "documentModuleId" | "documentModuleName" | "docFamily">> {
  return {
    projectId: normalizeDocumentScopeId(directProjectContext?.projectId)
      || normalizeDocumentScopeId(configProjectContext?.projectId)
      || normalizeDocumentScopeId(saasContext.projectId),
    projectKey: normalizeDocumentScopeId(directProjectContext?.projectKey)
      || normalizeDocumentScopeId(configProjectContext?.projectKey)
      || null,
    projectName: normalizeDocumentScopeId(directProjectContext?.projectName)
      || normalizeDocumentScopeId(configProjectContext?.projectName)
      || null,
    documentModuleId: normalizeDocumentScopeId(directProjectContext?.documentModuleId)
      || normalizeDocumentScopeId(configProjectContext?.documentModuleId)
      || normalizeDocumentScopeId(saasContext.documentModuleId)
      || "HBCE-CYBERNETIC-DOCUMENT-MODULE-DEFAULT",
    documentModuleName: normalizeDocumentScopeId(directProjectContext?.documentModuleName)
      || normalizeDocumentScopeId(configProjectContext?.documentModuleName)
      || "HBCE Cybernetic Document Module",
    docFamily: normalizeDocumentFamily(directProjectContext?.docFamily)
      || normalizeDocumentFamily(configProjectContext?.docFamily)
      || normalizeDocumentFamily(inferredDocFamily)
  };
}

function resolveCyberneticDocumentRecallConfig(args: {
  saasContext: CyberneticSaasContext;
  projectContext?: CyberneticDocumentProjectContext | null;
  recallConfig?: CyberneticDocumentRecallConfig | null;
  inferredDocFamily?: string | null;
  promptMaxChars: number;
  limit: number;
}): ResolvedCyberneticDocumentRecallConfig {
  const projectContext = mergeCyberneticProjectContext(
    args.saasContext,
    args.projectContext || null,
    args.recallConfig?.projectContext || null,
    args.inferredDocFamily || null
  );
  const allowedDocFamilies = (args.recallConfig?.allowedDocFamilies || [])
    .map(normalizeDocumentFamily)
    .filter((item): item is string => Boolean(item));

  if (projectContext.docFamily && !allowedDocFamilies.includes(projectContext.docFamily)) {
    allowedDocFamilies.push(projectContext.docFamily);
  }

  const maxDocumentCount = boundedPositiveInteger(
    args.recallConfig?.maxDocumentCount ?? args.limit,
    DEFAULT_CYBERNETIC_DOCUMENT_RECALL_MAX_DOCUMENT_COUNT,
    1,
    50
  );
  const promptMaxChars = boundedPositiveInteger(
    args.recallConfig?.promptMaxChars ?? args.promptMaxChars,
    DEFAULT_CYBERNETIC_DOCUMENT_RECALL_PROMPT_MAX_CHARS,
    0,
    120000
  );
  const policyMode = args.recallConfig?.policyMode || "FAIL_CLOSED_ON_MISSING";

  return {
    projectContext,
    policyMode,
    maxDocumentCount,
    promptMaxChars,
    allowedDocFamilies,
    requireVerifiedIpr: args.recallConfig?.requireVerifiedIpr !== false,
    requireTenantScope: args.recallConfig?.requireTenantScope !== false,
    requireWorkspaceScope: args.recallConfig?.requireWorkspaceScope !== false,
    requireProjectScope: args.recallConfig?.requireProjectScope === true,
    allowCrossTenantRecall: args.recallConfig?.allowCrossTenantRecall === true,
    allowCrossWorkspaceRecall: args.recallConfig?.allowCrossWorkspaceRecall === true,
    allowCrossProjectRecall: args.recallConfig?.allowCrossProjectRecall === true,
    failClosedOnMissingRequestedIds: args.recallConfig?.failClosedOnMissingRequestedIds
      ?? policyMode !== "PARTIAL_ALLOWED",
    orderedRecall: args.recallConfig?.orderedRecall !== false
  };
}

function publicProfileStringFromAliases(
  item: CyberneticDocumentProfileRecallItem,
  aliases: string[]
): string | null {
  for (const alias of aliases) {
    const direct = (item as unknown as Record<string, unknown>)[alias];
    const directValue = normalizeNullableText(direct);

    if (directValue) {
      return directValue;
    }

    const publicValue = normalizeNullableText(item.publicProfile?.[alias]);

    if (publicValue) {
      return publicValue;
    }
  }

  return null;
}

function hasConflictingScopeValue(args: {
  item: CyberneticDocumentProfileRecallItem;
  expected: string | null;
  aliases: string[];
  requireValue: boolean;
}): boolean {
  if (!args.expected) {
    return false;
  }

  const actual = publicProfileStringFromAliases(args.item, args.aliases);

  if (!actual) {
    return args.requireValue;
  }

  return normalizeText(actual) !== normalizeText(args.expected);
}

function applyCyberneticDocumentRecallIsolation(args: {
  items: CyberneticDocumentProfileRecallItem[];
  saasContext: CyberneticSaasContext;
  config: ResolvedCyberneticDocumentRecallConfig;
}): { items: CyberneticDocumentProfileRecallItem[]; isolation: CyberneticDocumentRecallIsolationReport } {
  const tenantId = normalizeDocumentScopeId(args.saasContext.tenantId);
  const workspaceId = normalizeDocumentScopeId(args.saasContext.workspaceId);
  const projectId = args.config.projectContext.projectId;
  const allowedDocFamilySet = new Set(args.config.allowedDocFamilies.map((item) => normalizeText(item)));
  const isolation: CyberneticDocumentRecallIsolationReport = {
    tenantScoped: Boolean(tenantId) && !args.config.allowCrossTenantRecall,
    workspaceScoped: Boolean(workspaceId) && !args.config.allowCrossWorkspaceRecall,
    projectScoped: Boolean(projectId) && !args.config.allowCrossProjectRecall,
    docFamilyScoped: allowedDocFamilySet.size > 0,
    rejectedByTenant: 0,
    rejectedByWorkspace: 0,
    rejectedByProject: 0,
    rejectedByDocFamily: 0
  };
  const filtered: CyberneticDocumentProfileRecallItem[] = [];

  for (const item of args.items) {
    if (isolation.tenantScoped && hasConflictingScopeValue({
      item,
      expected: tenantId,
      aliases: ["tenantId", "tenant_id", "tenant"],
      requireValue: false
    })) {
      isolation.rejectedByTenant += 1;
      continue;
    }

    if (isolation.workspaceScoped && hasConflictingScopeValue({
      item,
      expected: workspaceId,
      aliases: ["workspaceId", "workspace_id", "workspace"],
      requireValue: false
    })) {
      isolation.rejectedByWorkspace += 1;
      continue;
    }

    if (isolation.projectScoped && hasConflictingScopeValue({
      item,
      expected: projectId,
      aliases: ["projectId", "project_id", "projectKey", "project_key"],
      requireValue: args.config.requireProjectScope
    })) {
      isolation.rejectedByProject += 1;
      continue;
    }

    if (isolation.docFamilyScoped) {
      const docFamily = item.docFamily ? normalizeText(item.docFamily) : null;

      if (docFamily && !allowedDocFamilySet.has(docFamily)) {
        isolation.rejectedByDocFamily += 1;
        continue;
      }
    }

    filtered.push(item);
  }

  return { items: filtered, isolation };
}

function emptyCyberneticDocumentRecallIsolationReport(): CyberneticDocumentRecallIsolationReport {
  return {
    tenantScoped: false,
    workspaceScoped: false,
    projectScoped: false,
    docFamilyScoped: false,
    rejectedByTenant: 0,
    rejectedByWorkspace: 0,
    rejectedByProject: 0,
    rejectedByDocFamily: 0
  };
}

function documentProfileString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  const normalized = stringFromValue(value).trim();
  return normalized || null;
}

function documentProfileNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.round(Number(value));
  }

  return null;
}

function documentProfileBoolean(record: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = record[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = normalizeText(value.trim());

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

function documentProfileStringArray(value: unknown): string[] {
  const normalizeItems = (items: unknown[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of items) {
      const normalized = stringFromValue(item).trim();

      if (!normalized) {
        continue;
      }

      const key = normalizeText(normalized);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(normalized);
    }

    return result;
  };

  if (Array.isArray(value)) {
    return normalizeItems(value);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (Array.isArray(parsed)) {
        return normalizeItems(parsed);
      }
    } catch {
      return normalizeItems(value.split(/[;,\n]/g));
    }
  }

  return [];
}

function normalizeRequestedDocumentFilename(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .trim()
    .replace(/^file\s*[:=-]\s*/i, "")
    .replace(/^filename\s*[:=-]\s*/i, "")
    .replace(/[\s`'".,;:]+$/g, "")
    .slice(0, 220);

  return cleaned || null;
}

function extractRequestedDocumentFilename(message: string, files: CyberneticDocumentFileSnapshot[]): string | null {
  const normalizedMessage = normalizeText(message);

  for (const file of files) {
    const candidate = file.name || file.filename || null;

    if (candidate && normalizedMessage.includes(normalizeText(candidate))) {
      return candidate;
    }
  }

  const filePattern = /(?:file|filename|nome\s+file)?\s*[:=]?\s*([\wÀ-ÿ ._\-()]+\.(?:txt|pdf|md|markdown|json|csv|docx|doc|ts|tsx|js|jsx))/i;
  const match = message.match(filePattern);

  return normalizeRequestedDocumentFilename(match?.[1] || null);
}

function inferDocumentRecallFamily(message: string): string | null {
  const normalized = normalizeText(message);

  if (normalized.includes("apokalypsis")) {
    return "APOKALYPSIS";
  }

  if (
    normalized.includes("u.s.e") ||
    normalized.includes("united states of europe") ||
    normalized.includes("use volume") ||
    normalized.includes("voto digitale federato")
  ) {
    return "USE";
  }

  if (
    normalized.includes("matrix") ||
    normalized.includes("corpus esoterologia") ||
    normalized.includes("esoterologia ermetica") ||
    normalized.includes("lex hermeticum") ||
    normalized.includes("portale dell'anticristo") ||
    normalized.includes("portale dell’antichristo") ||
    normalized.includes("portale dell'anticristo") ||
    normalized.includes("alien code")
  ) {
    return "CORPUS_ESOTEROLOGIA_ERMETICA";
  }

  if (normalized.includes("cod 1") || normalized.includes("codice alieno")) {
    return "ALIEN_CODE";
  }

  if (normalized.includes("hbce") || normalized.includes("joker-c2") || normalized.includes("ipr")) {
    return "HBCE_OPERATIONAL_DOCUMENT";
  }

  return null;
}

function inferDocumentRecallVolume(message: string): string | null {
  const normalized = normalizeText(message);
  const romanMap: Array<[string, string]> = [
    ["volume i", "V1"],
    ["volume 1", "V1"],
    ["volumi i", "V1"],
    ["volume ii", "V2"],
    ["volume 2", "V2"],
    ["volume iii", "V3"],
    ["volume 3", "V3"],
    ["volume iv", "V4"],
    ["volume 4", "V4"],
    ["volume v", "V5"],
    ["volume 5", "V5"]
  ];

  for (const [signal, volume] of romanMap) {
    if (normalized.includes(signal)) {
      return volume;
    }
  }

  const compactMatch = normalized.match(/\bv\s*([1-5])\b/);

  if (compactMatch?.[1]) {
    return `V${compactMatch[1]}`;
  }

  return null;
}

export function extractRequestedIprMemoryIds(message: string): string[] {
  const matches = message.match(/IPR-MEM-\d{14}-[A-Z0-9]+/gi) || [];
  return Array.from(new Set(matches.map((item) => item.trim().toUpperCase())));
}

export function extractRequestedDocumentProfileIds(message: string): string[] {
  const matches = message.match(/DOC-PROFILE-[A-Z0-9]+/gi) || [];
  return Array.from(new Set(matches.map((item) => item.trim().toUpperCase())));
}

export function extractRequestedSavedChatIds(message: string): string[] {
  const matches = message.match(/IPR-CHAT-SAVE-\d{14}-[A-Z0-9]+/gi) || [];
  return Array.from(new Set(matches.map((item) => item.trim().toUpperCase())));
}

function normalizeDirectLookupToken(value: string | null | undefined): string | null {
  const normalized = normalizeNullableText(value);

  return normalized ? normalized.toUpperCase() : null;
}

function directLookupSet(values: Array<string | null | undefined>): Set<string> {
  return new Set(
    values
      .map(normalizeDirectLookupToken)
      .filter((item): item is string => Boolean(item))
  );
}

function directLookupHasExactValue(values: Array<string | null | undefined>, lookup: Set<string>): boolean {
  if (!lookup.size) {
    return false;
  }

  return values.some((value) => {
    const normalized = normalizeDirectLookupToken(value);
    return normalized ? lookup.has(normalized) : false;
  });
}

function documentProfileScopeConflicts(args: {
  item: CyberneticDocumentProfileRecallItem;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
}): boolean {
  const expectedTenantId = normalizeDocumentScopeId(args.tenantId);
  const expectedWorkspaceId = normalizeDocumentScopeId(args.workspaceId);
  const expectedHumanIpr = normalizeDocumentScopeId(args.humanIpr);

  if (expectedTenantId && hasConflictingScopeValue({
    item: args.item,
    expected: expectedTenantId,
    aliases: ["tenantId", "tenant_id", "tenant"],
    requireValue: false
  })) {
    return true;
  }

  if (expectedWorkspaceId && hasConflictingScopeValue({
    item: args.item,
    expected: expectedWorkspaceId,
    aliases: ["workspaceId", "workspace_id", "workspace"],
    requireValue: false
  })) {
    return true;
  }

  if (expectedHumanIpr && hasConflictingScopeValue({
    item: args.item,
    expected: expectedHumanIpr,
    aliases: ["humanIpr", "human_ipr", "ipr", "subjectIpr"],
    requireValue: false
  })) {
    return true;
  }

  return false;
}

function documentProfileMatchesLinkedDirectRequest(args: {
  item: CyberneticDocumentProfileRecallItem;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  requestedSavedChatIds: string[];
  sessionId: string | null;
  requestedFilename: string | null;
}): boolean {
  const requestedMemorySet = directLookupSet(args.requestedMemoryIds);
  const requestedProfileSet = directLookupSet(args.requestedProfileIds);
  const requestedSavedChatSet = directLookupSet(args.requestedSavedChatIds);
  const requestedSessionSet = directLookupSet([args.sessionId]);
  const requestedFilename = normalizeText(args.requestedFilename || "");

  if (directLookupHasExactValue([args.item.profileId], requestedProfileSet)) {
    return true;
  }

  if (directLookupHasExactValue([args.item.memoryId], requestedMemorySet)) {
    return true;
  }

  if (directLookupHasExactValue([args.item.sourceSavedChatId], requestedSavedChatSet)) {
    return true;
  }

  if (directLookupHasExactValue([
    documentProfileString(args.item.publicProfile, "sessionId"),
    documentProfileString(args.item.publicProfile, "threadId")
  ], requestedSessionSet)) {
    return true;
  }

  if (requestedFilename) {
    const filename = normalizeText(args.item.filename || "");
    return Boolean(filename && filename.includes(requestedFilename));
  }

  return false;
}

function isActiveReusableDocumentProfileRecallItem(item: CyberneticDocumentProfileRecallItem): boolean {
  return item.reusableInPrompt !== false && item.profileStatus !== "DELETED";
}

function normalizeDocumentProfileRow(row: DocumentProfileDatabaseRow): CyberneticDocumentProfileRecallItem {
  const rawPublicProfile = toPublicDocumentProfile(row) as Record<string, unknown>;
  const useRepairedPublicProfile = withUseEuropeanFederationProfileSummaryHardRepair(rawPublicProfile);
  const publicProfile = withHbceAiEcosystemProfileSummaryHardRepair(useRepairedPublicProfile);

  return {
    profileId: documentProfileString(publicProfile, "profileId"),
    profileKeyHash: documentProfileString(publicProfile, "profileKeyHash"),
    fileId: documentProfileString(publicProfile, "fileId"),
    filename: documentProfileString(publicProfile, "filename"),
    fileHash: documentProfileString(publicProfile, "fileHash"),
    docFamily: documentProfileString(publicProfile, "docFamily"),
    volume: documentProfileString(publicProfile, "volume"),
    title: documentProfileString(publicProfile, "title"),
    subtitle: documentProfileString(publicProfile, "subtitle"),
    canonicalAxis: documentProfileString(publicProfile, "canonicalAxis"),
    summary: documentProfileString(publicProfile, "summary"),
    keyTerms: documentProfileStringArray(publicProfile.keyTerms),
    semanticTerms: Array.isArray(publicProfile.semanticTerms) ? publicProfile.semanticTerms : [],
    memoryId: documentProfileString(publicProfile, "memoryId"),
    sourceSavedChatId: documentProfileString(publicProfile, "sourceSavedChatId"),
    lastEvtId: documentProfileString(publicProfile, "lastEvtId"),
    lastOpcProofId: documentProfileString(publicProfile, "lastOpcProofId"),
    textStatus: documentProfileString(publicProfile, "textStatus"),
    textLength: documentProfileNumber(publicProfile, "textLength"),
    mimeType: documentProfileString(publicProfile, "mimeType"),
    quality: documentProfileString(publicProfile, "quality"),
    reusableInPrompt: documentProfileBoolean(publicProfile, "reusableInPrompt", true),
    recallScore: documentProfileNumber(publicProfile, "recallScore"),
    profileStatus: documentProfileString(publicProfile, "profileStatus"),
    updatedAt: documentProfileString(publicProfile, "updatedAt"),
    publicProfile,
    legalCertification: false
  };
}

function dedupeDocumentProfileRecallItems(items: CyberneticDocumentProfileRecallItem[]): CyberneticDocumentProfileRecallItem[] {
  const seen = new Set<string>();
  const result: CyberneticDocumentProfileRecallItem[] = [];

  for (const item of items) {
    const key = [item.profileId, item.memoryId, item.fileHash, item.filename]
      .filter(Boolean)
      .join("|");

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function scoreDocumentProfileFallback(
  item: CyberneticDocumentProfileRecallItem,
  message: string,
  requestedMemoryIds: string[]
): number {
  const normalized = normalizeText(message);
  let score = item.recallScore ?? 0;

  if (item.memoryId && requestedMemoryIds.includes(item.memoryId.toUpperCase())) {
    score += 1000;
  }

  const haystack = normalizeText([
    item.profileId,
    item.filename,
    item.title,
    item.subtitle,
    item.docFamily,
    item.volume,
    item.canonicalAxis,
    item.summary,
    item.keyTerms.join(" ")
  ].filter(Boolean).join(" "));

  for (const signal of [
    "matrix",
    "corpus",
    "apokalypsis",
    "u.s.e",
    "dominio istituzionale",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "lex hermeticum",
    "alien code",
    "portale"
  ]) {
    if (normalized.includes(signal) && haystack.includes(signal)) {
      score += 25;
    }
  }

  if (item.textStatus === "TEXT_READY" || item.textStatus === "PDF_INGESTION_READY") {
    score += 20;
  }

  if (item.quality === "CANONICAL") {
    score += 15;
  }

  return score;
}

function buildDocumentProfilePromptBlock(items: CyberneticDocumentProfileRecallItem[], maxChars: number): string {
  if (!items.length) {
    return "";
  }

  const lines = [
    "HBCE / JOKER-C2 CYBERNETIC DOCUMENT PROFILE RECALL BLOCK",
    `Engine revision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    "Use these document profiles as reusable operational document memory, not as raw file text.",
    "The profile registry is data-driven: /api/chat must not hardcode file IDs, corpus titles, or volume templates.",
    "Boundary: legalCertification=false; OPC is a technical proof receipt only.",
    ""
  ];

  items.forEach((item, index) => {
    lines.push(`DOCUMENT PROFILE ${index + 1}`);
    lines.push(`profileId: ${item.profileId || "NO_PROFILE_ID"}`);
    lines.push(`memoryId: ${item.memoryId || "NO_LINKED_MEMORY_ID"}`);
    lines.push(`filename: ${item.filename || "NO_FILENAME"}`);
    lines.push(`fileHash: ${item.fileHash || "NO_FILE_HASH"}`);
    lines.push(`textStatus: ${item.textStatus || "UNKNOWN_TEXT_STATUS"}`);
    lines.push(`docFamily: ${item.docFamily || "UNKNOWN_DOC_FAMILY"}`);
    lines.push(`volume: ${item.volume || "UNKNOWN_VOLUME"}`);
    lines.push(`title: ${item.title || "UNKNOWN_TITLE"}`);
    lines.push(`canonicalAxis: ${item.canonicalAxis || "NO_CANONICAL_AXIS"}`);
    lines.push(`summary: ${item.summary || "NO_SUMMARY"}`);
    const useSummaryRepairLines = useEuropeanFederationProfileSummaryHardRepairLines(item);
    if (useSummaryRepairLines.length) {
      lines.push(...useSummaryRepairLines);
    }
    const summaryRepairLines = hbceAiEcosystemProfileSummaryHardRepairLines(item);
    if (summaryRepairLines.length) {
      lines.push(...summaryRepairLines);
    }
    lines.push(`keyTerms: ${item.keyTerms.join(", ") || "NO_KEY_TERMS"}`);
    lines.push(`quality: ${item.quality || "UNKNOWN"}`);
    lines.push(`recallScore: ${String(item.recallScore ?? "NO_RECALL_SCORE")}`);
    lines.push("legalCertification: false");
    lines.push("");
  });

  return truncateCyberneticDocumentPromptBlock(lines.join("\n"), maxChars);
}

async function queryDocumentProfilesForRecall(args: {
  message: string;
  requestedMemoryId: string | null;
  requestedProfileId: string | null;
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  limit: number;
}): Promise<CyberneticDocumentProfileRecallItem[]> {
  const attempts: Array<{
    memoryId?: string | null;
    filename?: string | null;
    query?: string | null;
    docFamily?: string | null;
    volume?: string | null;
  }> = [];

  if (args.requestedMemoryId) {
    attempts.push({ memoryId: args.requestedMemoryId });
  }

  if (args.requestedProfileId) {
    attempts.push({ query: args.requestedProfileId });
  }

  if (args.requestedFilename) {
    attempts.push({ filename: args.requestedFilename });
  }

  attempts.push({
    query: args.message,
    docFamily: args.requestedDocFamily,
    volume: args.requestedVolume
  });

  attempts.push({ query: args.message });

  const results: CyberneticDocumentProfileRecallItem[] = [];
  let lastError: string | null = null;

  for (const attempt of attempts) {
    const queryResult = await findDocumentProfilesForRecallFromDatabase({
      query: attempt.query ?? null,
      memoryId: attempt.memoryId ?? null,
      filename: attempt.filename ?? null,
      docFamily: attempt.docFamily ?? null,
      volume: attempt.volume ?? null,
      humanIpr: args.humanIpr,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId,
      limit: args.limit
    });

    if (!queryResult.ok) {
      lastError = queryResult.error || "DOCUMENT_PROFILE_QUERY_FAILED";
      continue;
    }

    results.push(...queryResult.rows.map(normalizeDocumentProfileRow));
  }

  const requestedMemoryIds = args.requestedMemoryId ? [args.requestedMemoryId] : [];
  const deduped = dedupeDocumentProfileRecallItems(results)
    .filter(isActiveReusableDocumentProfileRecallItem)
    .sort((a, b) =>
      scoreDocumentProfileFallback(b, args.message, requestedMemoryIds) -
      scoreDocumentProfileFallback(a, args.message, requestedMemoryIds)
    )
    .slice(0, args.limit);

  if (!deduped.length && lastError) {
    throw new Error(lastError);
  }

  return deduped;
}

async function queryDocumentProfilesByLinkedDirectMatch(args: {
  message: string;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string | null;
  limit: number;
}): Promise<CyberneticDocumentProfileRecallItem[]> {
  const requestedSavedChatIds = extractRequestedSavedChatIds(args.message);
  const explicitLookupRequested = Boolean(
    args.requestedMemoryIds.length
    || args.requestedProfileIds.length
    || requestedSavedChatIds.length
    || args.requestedFilename
  );

  if (!explicitLookupRequested) {
    return [];
  }

  const scopeAttempts: Array<{
    humanIpr: string | null;
    tenantId: string | null;
    workspaceId: string | null;
  }> = [
    {
      humanIpr: args.humanIpr,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId
    },
    {
      humanIpr: null,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId
    },
    {
      humanIpr: args.humanIpr,
      tenantId: null,
      workspaceId: null
    },
    {
      humanIpr: null,
      tenantId: null,
      workspaceId: null
    }
  ];

  const results: CyberneticDocumentProfileRecallItem[] = [];
  const seenScopeKeys = new Set<string>();
  let lastError: string | null = null;

  for (const scope of scopeAttempts) {
    const scopeKey = [
      scope.humanIpr || "NO_HUMAN_IPR",
      scope.tenantId || "NO_TENANT",
      scope.workspaceId || "NO_WORKSPACE"
    ].join("|");

    if (seenScopeKeys.has(scopeKey)) {
      continue;
    }

    seenScopeKeys.add(scopeKey);

    const queryResult = await listDocumentProfilesFromDatabase({
      humanIpr: scope.humanIpr,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      includeSoftDeleted: false,
      limit: Math.max(args.limit, args.requestedMemoryIds.length + args.requestedProfileIds.length + requestedSavedChatIds.length, 50)
    });

    if (!queryResult.ok) {
      lastError = queryResult.error || "DOCUMENT_PROFILE_DIRECT_LOOKUP_FAILED";
      continue;
    }

    const normalizedRows = queryResult.rows
      .map(normalizeDocumentProfileRow)
      .filter(isActiveReusableDocumentProfileRecallItem)
      .filter((item) =>
        documentProfileMatchesLinkedDirectRequest({
          item,
          requestedMemoryIds: args.requestedMemoryIds,
          requestedProfileIds: args.requestedProfileIds,
          requestedSavedChatIds,
          sessionId: args.sessionId,
          requestedFilename: args.requestedFilename
        })
      )
      .filter((item) => !documentProfileScopeConflicts({
        item,
        humanIpr: args.humanIpr,
        tenantId: args.tenantId,
        workspaceId: args.workspaceId
      }));

    results.push(...normalizedRows);
  }

  const deduped = dedupeDocumentProfileRecallItems(results)
    .sort((a, b) =>
      scoreDocumentProfileFallback(b, args.message, args.requestedMemoryIds) -
      scoreDocumentProfileFallback(a, args.message, args.requestedMemoryIds)
    )
    .slice(0, args.limit);

  if (!deduped.length && lastError) {
    throw new Error(lastError);
  }

  return deduped;
}


function applyStrictRequestedDocumentProfileFilter(args: {
  items: CyberneticDocumentProfileRecallItem[];
  requestedProfileIds: string[];
  requestedMemoryIds: string[];
}): CyberneticDocumentProfileRecallItem[] {
  const requestedProfileSet = new Set(args.requestedProfileIds.map((item) => item.toUpperCase()));
  const requestedMemorySet = new Set(args.requestedMemoryIds.map((item) => item.toUpperCase()));

  if (!requestedProfileSet.size && !requestedMemorySet.size) {
    return args.items;
  }

  const exactItems = args.items.filter((item) => {
    const profileMatch = item.profileId ? requestedProfileSet.has(item.profileId.toUpperCase()) : false;
    const memoryMatch = item.memoryId ? requestedMemorySet.has(item.memoryId.toUpperCase()) : false;

    if (requestedProfileSet.size && requestedMemorySet.size) {
      return profileMatch && memoryMatch;
    }

    return profileMatch || memoryMatch;
  });

  if (exactItems.length) {
    return dedupeDocumentProfileRecallItems(exactItems);
  }

  return [];
}

function orderedDocumentProfileRecallItemsFromRequests(args: {
  items: CyberneticDocumentProfileRecallItem[];
  requestedProfileIds: string[];
  requestedMemoryIds: string[];
}): CyberneticDocumentProfileRecallItem[] {
  if (!args.items.length) {
    return [];
  }

  const ordered: CyberneticDocumentProfileRecallItem[] = [];
  const seen = new Set<string>();

  const pushOnce = (item: CyberneticDocumentProfileRecallItem, fallbackKey: string): void => {
    const key = item.profileId || item.memoryId || item.fileHash || item.filename || fallbackKey;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    ordered.push(item);
  };

  for (const requestedProfileId of args.requestedProfileIds) {
    const match = args.items.find(
      (item) => item.profileId && item.profileId.toUpperCase() === requestedProfileId.toUpperCase()
    );

    if (match) {
      pushOnce(match, requestedProfileId);
    }
  }

  for (const requestedMemoryId of args.requestedMemoryIds) {
    const match = args.items.find(
      (item) => item.memoryId && item.memoryId.toUpperCase() === requestedMemoryId.toUpperCase()
    );

    if (match) {
      pushOnce(match, requestedMemoryId);
    }
  }

  for (const item of args.items) {
    pushOnce(item, item.profileId || item.memoryId || item.filename || "DOCUMENT_PROFILE");
  }

  return ordered;
}

function documentProfileRecallRegistryStatus(recall: CyberneticDocumentProfileRecall | null): string {
  if (!recall) {
    return "NOT_REQUESTED";
  }

  if (recall.failClosed) {
    return "FAIL_CLOSED";
  }

  if (recall.error) {
    return "QUERY_FAILED";
  }

  if (recall.items.length) {
    return "AVAILABLE";
  }

  return "EMPTY";
}

export async function resolveCyberneticDocumentProfileRecall(args: {
  handoff: CyberneticHandoffContext;
  saasContext: CyberneticSaasContext;
  projectContext?: CyberneticDocumentProjectContext | null;
  recallConfig?: CyberneticDocumentRecallConfig | null;
  sessionId: string;
  message: string;
  files: CyberneticDocumentFileSnapshot[];
  limit: number;
  promptMaxChars: number;
}): Promise<CyberneticDocumentProfileRecall> {
  const humanIpr = args.handoff.humanIpr || null;
  const requestedMemoryIds = extractRequestedIprMemoryIds(args.message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(args.message);
  const requestedFilename = extractRequestedDocumentFilename(args.message, args.files);
  const inferredDocFamily = inferDocumentRecallFamily(args.message);
  const config = resolveCyberneticDocumentRecallConfig({
    saasContext: args.saasContext,
    projectContext: args.projectContext || null,
    recallConfig: args.recallConfig || null,
    inferredDocFamily,
    promptMaxChars: args.promptMaxChars,
    limit: args.limit
  });
  const requestedDocFamily = inferredDocFamily || config.projectContext.docFamily;
  const requestedVolume = inferDocumentRecallVolume(args.message);
  const maxDocumentCount = Math.max(
    config.maxDocumentCount,
    requestedMemoryIds.length,
    requestedProfileIds.length,
    1
  );

  const base: Omit<CyberneticDocumentProfileRecall, "status" | "injected" | "items" | "profileIds" | "memoryIds" | "promptBlock" | "error"> = {
    enabled: true,
    source: "document_profiles",
    humanIpr,
    tenantId: args.saasContext.tenantId || null,
    workspaceId: args.saasContext.workspaceId || null,
    projectId: config.projectContext.projectId,
    documentModuleId: config.projectContext.documentModuleId,
    sessionId: args.sessionId,
    query: args.message,
    requestedMemoryIds,
    requestedProfileIds,
    strictRequestedMemoryOnly: requestedMemoryIds.length > 0,
    strictRequestedMemoryFilter: requestedMemoryIds.length > 0
      ? "REQUESTED_MEMORY_ID_APPLIED"
      : "NO_REQUESTED_MEMORY_ID",
    requestedFilename,
    requestedDocFamily,
    requestedVolume,
    requestedProjectId: config.projectContext.projectId,
    requestedDocumentModuleId: config.projectContext.documentModuleId,
    recallPolicyMode: config.policyMode,
    maxDocumentCount,
    allowedDocFamilies: config.allowedDocFamilies,
    missingMemoryIds: [],
    missingProfileIds: [],
    failClosed: false,
    failClosedReason: null,
    isolation: emptyCyberneticDocumentRecallIsolationReport(),
    legalCertification: false
  };

  if (config.requireVerifiedIpr && (!humanIpr || args.handoff.identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT")) {
    return {
      ...base,
      injected: false,
      status: "DOCUMENT_PROFILE_RECALL_QUERY_FAILED",
      items: [],
      profileIds: [],
      memoryIds: [],
      promptBlock: "",
      error: "Verified human IPR is required before injecting document profile recall into /api/chat."
    };
  }

  try {
    const queryLimit = Math.min(maxDocumentCount, 50);
    let queriedItems: CyberneticDocumentProfileRecallItem[] = [];

    if (requestedMemoryIds.length > 1) {
      queriedItems = dedupeDocumentProfileRecallItems((
        await Promise.all(
          requestedMemoryIds.map((requestedMemoryId) =>
            queryDocumentProfilesForRecall({
              message: args.message,
              requestedMemoryId,
              requestedProfileId: null,
              requestedFilename: null,
              requestedDocFamily,
              requestedVolume,
              humanIpr,
              tenantId: args.saasContext.tenantId || null,
              workspaceId: args.saasContext.workspaceId || null,
              limit: queryLimit
            })
          )
        )
      ).flat());
    } else if (requestedProfileIds.length > 1) {
      queriedItems = dedupeDocumentProfileRecallItems((
        await Promise.all(
          requestedProfileIds.map((requestedProfileId) =>
            queryDocumentProfilesForRecall({
              message: args.message,
              requestedMemoryId: null,
              requestedProfileId,
              requestedFilename: null,
              requestedDocFamily,
              requestedVolume,
              humanIpr,
              tenantId: args.saasContext.tenantId || null,
              workspaceId: args.saasContext.workspaceId || null,
              limit: queryLimit
            })
          )
        )
      ).flat());
    } else {
      queriedItems = await queryDocumentProfilesForRecall({
        message: args.message,
        requestedMemoryId: requestedMemoryIds[0] || null,
        requestedProfileId: requestedProfileIds[0] || null,
        requestedFilename,
        requestedDocFamily,
        requestedVolume,
        humanIpr,
        tenantId: args.saasContext.tenantId || null,
        workspaceId: args.saasContext.workspaceId || null,
        limit: queryLimit
      });
    }

    const directLinkedItems = await queryDocumentProfilesByLinkedDirectMatch({
      message: args.message,
      requestedMemoryIds,
      requestedProfileIds,
      requestedFilename,
      requestedDocFamily,
      requestedVolume,
      humanIpr,
      tenantId: args.saasContext.tenantId || null,
      workspaceId: args.saasContext.workspaceId || null,
      sessionId: args.sessionId || null,
      limit: queryLimit
    });
    queriedItems = dedupeDocumentProfileRecallItems([
      ...directLinkedItems,
      ...queriedItems
    ]);

    const strictItems = applyStrictRequestedDocumentProfileFilter({
      items: queriedItems,
      requestedProfileIds,
      requestedMemoryIds
    });
    const isolated = applyCyberneticDocumentRecallIsolation({
      items: strictItems,
      saasContext: args.saasContext,
      config
    });
    const explicitDirectMatchAvailable = strictItems.some((item) =>
      documentProfileMatchesLinkedDirectRequest({
        item,
        requestedMemoryIds,
        requestedProfileIds,
        requestedSavedChatIds: extractRequestedSavedChatIds(args.message),
        sessionId: args.sessionId || null,
        requestedFilename
      })
    );
    const isolatedItems = isolated.items.length || !explicitDirectMatchAvailable
      ? isolated.items
      : strictItems.filter((item) =>
          !documentProfileScopeConflicts({
            item,
            humanIpr,
            tenantId: args.saasContext.tenantId || null,
            workspaceId: args.saasContext.workspaceId || null
          })
        );
    const orderedItems = config.orderedRecall
      ? orderedDocumentProfileRecallItemsFromRequests({
          items: isolatedItems,
          requestedProfileIds,
          requestedMemoryIds
        })
      : isolatedItems;
    const items = orderedItems.slice(0, queryLimit);
    const profileIds = Array.from(new Set(items.map((item) => item.profileId).filter((item): item is string => Boolean(item))));
    const memoryIds = Array.from(new Set(items.map((item) => item.memoryId).filter((item): item is string => Boolean(item))));
    const memoryIdSet = new Set(memoryIds.map((memoryId) => memoryId.toUpperCase()));
    const profileIdSet = new Set(profileIds.map((profileId) => profileId.toUpperCase()));
    const missingMemoryIds = requestedMemoryIds.filter((memoryId) => !memoryIdSet.has(memoryId.toUpperCase()));
    const missingProfileIds = requestedProfileIds.filter((profileId) => !profileIdSet.has(profileId.toUpperCase()));
    const explicitRequestCount = requestedMemoryIds.length + requestedProfileIds.length;
    const failClosed = Boolean(
      explicitRequestCount > 0
      && config.failClosedOnMissingRequestedIds
      && (missingMemoryIds.length > 0 || missingProfileIds.length > 0)
    );
    const failClosedReason = failClosed
      ? "Requested document memory/profile set is incomplete under the active recall policy. Prompt injection blocked."
      : null;
    const injectableItems = failClosed ? [] : items;
    const promptBlock = buildDocumentProfilePromptBlock(injectableItems, config.promptMaxChars ?? args.promptMaxChars);

    return {
      ...base,
      injected: injectableItems.length > 0,
      status: failClosed
        ? "DOCUMENT_PROFILE_RECALL_FAIL_CLOSED"
        : injectableItems.length > 0
          ? "DOCUMENT_PROFILE_RECALL_INJECTED"
          : "DOCUMENT_PROFILE_RECALL_EMPTY",
      items: injectableItems,
      profileIds: Array.from(new Set(injectableItems.map((item) => item.profileId).filter((item): item is string => Boolean(item)))),
      memoryIds: Array.from(new Set(injectableItems.map((item) => item.memoryId).filter((item): item is string => Boolean(item)))),
      missingMemoryIds,
      missingProfileIds,
      failClosed,
      failClosedReason,
      isolation: isolated.isolation,
      promptBlock,
      error: null
    };
  } catch (error) {
    return {
      ...base,
      injected: false,
      status: "DOCUMENT_PROFILE_RECALL_QUERY_FAILED",
      items: [],
      profileIds: [],
      memoryIds: [],
      promptBlock: "",
      error: errorToMessage(error)
    };
  }
}

function selectRequestedIprRecallItem(message: string, items: CyberneticIprRecallItem[]): CyberneticIprRecallItem | null {
  const requestedIds = extractRequestedIprMemoryIds(message).map((item) => normalizeText(item));

  if (requestedIds.length > 0) {
    const exact = items.find(
      (item) => item.memoryId && requestedIds.includes(normalizeText(item.memoryId))
    );

    if (exact) {
      return exact;
    }
  }

  return items[0] || null;
}

type StrictRequestedIprRecallContext = CyberneticIprRecallContext & {
  requestedMemoryIds: string[];
  strictRequestedMemoryOnly: boolean;
  strictRequestedMemoryFilter:
    | "NO_REQUESTED_MEMORY_ID"
    | "REQUESTED_MEMORY_ID_APPLIED"
    | "REQUESTED_MEMORY_ID_NOT_FOUND";
};

function filterIprRecallContextByRequestedMemoryId(
  message: string,
  recall: CyberneticIprRecallContext
): StrictRequestedIprRecallContext {
  const requestedMemoryIds = extractRequestedIprMemoryIds(message);

  if (!requestedMemoryIds.length) {
    return {
      ...recall,
      requestedMemoryIds,
      strictRequestedMemoryOnly: false,
      strictRequestedMemoryFilter: "NO_REQUESTED_MEMORY_ID"
    };
  }

  const requestedMemorySet = new Set(requestedMemoryIds.map((item) => item.toUpperCase()));
  const filteredItems = recall.items.filter(
    (item) => item.memoryId ? requestedMemorySet.has(item.memoryId.toUpperCase()) : false
  );
  const filteredMemoryIds = Array.from(new Set([
    ...filteredItems
      .map((item) => item.memoryId)
      .filter((item): item is string => Boolean(item)),
    ...recall.memoryIds.filter((memoryId) => requestedMemorySet.has(memoryId.toUpperCase()))
  ]));

  return {
    ...recall,
    items: filteredItems,
    memoryIds: filteredMemoryIds,
    requestedMemoryIds,
    strictRequestedMemoryOnly: true,
    strictRequestedMemoryFilter: filteredItems.length || filteredMemoryIds.length
      ? "REQUESTED_MEMORY_ID_APPLIED"
      : "REQUESTED_MEMORY_ID_NOT_FOUND"
  };
}

function selectDocumentProfileRecallItem(
  documentProfileRecall: CyberneticDocumentProfileRecall | null,
  message: string
): CyberneticDocumentProfileRecallItem | null {
  if (!documentProfileRecall?.items.length) {
    return null;
  }

  const requestedMemoryIds = extractRequestedIprMemoryIds(message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(message);
  const exactProfileMatch = requestedProfileIds.length
    ? documentProfileRecall.items.find(
        (item) => item.profileId && requestedProfileIds.includes(item.profileId.toUpperCase())
      )
    : null;

  if (exactProfileMatch) {
    return exactProfileMatch;
  }

  const exactMemoryMatch = requestedMemoryIds.length
    ? documentProfileRecall.items.find(
        (item) => item.memoryId && requestedMemoryIds.includes(item.memoryId.toUpperCase())
      )
    : null;

  if (exactMemoryMatch) {
    return exactMemoryMatch;
  }

  return documentProfileRecall.items[0] || null;
}

function orderedRequestedDocumentProfileRecallItems(
  documentProfileRecall: CyberneticDocumentProfileRecall | null,
  message: string
): CyberneticDocumentProfileRecallItem[] {
  if (!documentProfileRecall?.items.length) {
    return [];
  }

  return orderedDocumentProfileRecallItemsFromRequests({
    items: documentProfileRecall.items,
    requestedProfileIds: extractRequestedDocumentProfileIds(message),
    requestedMemoryIds: extractRequestedIprMemoryIds(message)
  });
}

function findMatchingRecallMemoryItem(
  recall: CyberneticIprRecallContext,
  documentProfile: CyberneticDocumentProfileRecallItem
): CyberneticIprRecallItem | null {
  if (!documentProfile.memoryId) {
    return null;
  }

  return recall.items.find((item) => item.memoryId === documentProfile.memoryId) || null;
}

function serializeDocumentSemanticTerms(semanticTerms: unknown[]): string {
  const terms = semanticTerms
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object" && "term" in item) {
        return stringFromValue((item as Record<string, unknown>).term).trim();
      }

      return stringFromValue(item).trim();
    })
    .filter(Boolean);

  return terms.join(", ") || "NO_SEMANTIC_TERMS";
}

function isMultiDocumentMemoryRecallRequested(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    normalized.includes("multi_document_memory_recall") ||
    normalized.includes("multi-document") ||
    normalized.includes("multi documento") ||
    normalized.includes("multi-doc") ||
    extractRequestedDocumentProfileIds(message).length > 1 ||
    extractRequestedIprMemoryIds(message).length > 1
  );
}

function buildCyberneticMultiDocumentMemoryRecallAnswer(args: CyberneticDocumentMemoryRecallAnswerInput): string {
  const requestedMemoryIds = extractRequestedIprMemoryIds(args.message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(args.message);
  const visibleRecall = filterIprRecallContextByRequestedMemoryId(args.message, args.recall);
  const documentProfiles = orderedRequestedDocumentProfileRecallItems(args.documentProfileRecall, args.message);
  const visibleProfileIds = Array.from(
    new Set(documentProfiles.map((item) => item.profileId).filter((item): item is string => Boolean(item)))
  );
  const visibleMemoryIds = Array.from(
    new Set(documentProfiles.map((item) => item.memoryId).filter((item): item is string => Boolean(item)))
  );
  const missingProfileIds = args.documentProfileRecall?.missingProfileIds?.length
    ? args.documentProfileRecall.missingProfileIds
    : requestedProfileIds.filter((profileId) => !visibleProfileIds.includes(profileId));
  const missingMemoryIds = args.documentProfileRecall?.missingMemoryIds?.length
    ? args.documentProfileRecall.missingMemoryIds
    : requestedMemoryIds.filter((memoryId) => !visibleMemoryIds.includes(memoryId));
  const expectedProfileCount = requestedProfileIds.length || requestedMemoryIds.length || documentProfiles.length;
  const failClosed = Boolean(args.documentProfileRecall?.failClosed);
  const complete =
    !failClosed &&
    documentProfiles.length > 0 &&
    !missingProfileIds.length &&
    !missingMemoryIds.length &&
    (expectedProfileCount === 0 || documentProfiles.length >= expectedProfileCount);
  const documentRegistryStatus = documentProfileRecallRegistryStatus(args.documentProfileRecall);
  const sections: string[] = [];

  documentProfiles.forEach((documentProfile, index) => {
    sections.push(`${index + 1}. Volume documentale richiamato`);
    sections.push(`memoryId: ${documentProfile.memoryId || "NO_MEMORY_ID"}`);
    sections.push(`documentProfileId: ${documentProfile.profileId || "NO_DOCUMENT_PROFILE_ID"}`);
    sections.push(`filename: ${documentProfile.filename || "NO_FILENAME"}`);
    sections.push(`fileHash: ${documentProfile.fileHash || "NO_FILE_HASH"}`);
    sections.push(`fileId: ${documentProfile.fileId || "NO_FILE_ID"}`);
    sections.push(`docFamily: ${documentProfile.docFamily || "UNKNOWN_DOC_FAMILY"}`);
    sections.push(`volume: ${documentProfile.volume || "UNKNOWN_VOLUME"}`);
    sections.push(`title: ${documentProfile.title || "UNKNOWN_TITLE"}`);
    sections.push(`canonicalAxis: ${documentProfile.canonicalAxis || "NO_CANONICAL_AXIS"}`);
    sections.push(`summary: ${documentProfile.summary || "NO_DOCUMENT_PROFILE_SUMMARY"}`);
    const summaryRepairLines = hbceAiEcosystemProfileSummaryHardRepairLines(documentProfile);
    if (summaryRepairLines.length) {
      sections.push(...summaryRepairLines);
    }
    sections.push(`textStatus: ${documentProfile.textStatus || "UNKNOWN_TEXT_STATUS"}`);
    sections.push(`textLength: ${String(documentProfile.textLength ?? "UNKNOWN_TEXT_LENGTH")}`);
    sections.push(`quality: ${documentProfile.quality || "UNKNOWN"}`);
    sections.push(`reusableInPrompt: ${String(documentProfile.reusableInPrompt)}`);
    sections.push(`keyTerms: ${documentProfile.keyTerms.join(", ") || "NO_KEY_TERMS"}`);
    sections.push(`semanticTerms: ${serializeDocumentSemanticTerms(documentProfile.semanticTerms)}`);
    sections.push(`EVT collegato: ${documentProfile.lastEvtId || "NO_EVT_IN_RECALL_RECORD"}`);
    sections.push(`OPC collegato: ${documentProfile.lastOpcProofId || "NO_OPC_IN_RECALL_RECORD"}`);
    sections.push("");
  });

  return [
    failClosed
      ? "MULTI_DOCUMENT_MEMORY_RECALL_FAIL_CLOSED"
      : complete
        ? "MULTI_DOCUMENT_MEMORY_RECALL_READY"
        : "MULTI_DOCUMENT_MEMORY_RECALL_PARTIAL",
    `DOCUMENT_MEMORY_RECALL_READY: ${String(!failClosed && documentProfiles.length > 0)}`,
    "MEMORY_CHAIN_RECALL_READY: true",
    "",
    "1. Stato multi-document recall",
    `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    `documentRegistry.status: ${documentRegistryStatus}`,
    `recallPolicyMode: ${args.documentProfileRecall?.recallPolicyMode || "UNSPECIFIED"}`,
    `projectId: ${args.documentProfileRecall?.projectId || args.saasContext.projectId || args.projectContext?.projectId || "NO_PROJECT_ID"}`,
    `documentModuleId: ${args.documentProfileRecall?.documentModuleId || args.saasContext.documentModuleId || args.projectContext?.documentModuleId || "NO_DOCUMENT_MODULE_ID"}`,
    `linkedProfileCount: ${String(documentProfiles.length)}`,
    `expectedProfileCount: ${String(expectedProfileCount || documentProfiles.length)}`,
    `maxDocumentCount: ${String(args.documentProfileRecall?.maxDocumentCount || "NO_MAX_DOCUMENT_COUNT")}`,
    `requestedMemoryIds: ${requestedMemoryIds.join(", ") || "NO_REQUESTED_MEMORY_IDS"}`,
    `requestedDocumentProfileIds: ${requestedProfileIds.join(", ") || "NO_REQUESTED_DOCUMENT_PROFILE_IDS"}`,
    `memoryIds: ${visibleMemoryIds.join(", ") || "NO_MEMORY_IDS"}`,
    `profileIds: ${visibleProfileIds.join(", ") || "NO_PROFILE_IDS"}`,
    `missingMemoryIds: ${missingMemoryIds.join(", ") || "NONE"}`,
    `missingProfileIds: ${missingProfileIds.join(", ") || "NONE"}`,
    `failClosed: ${String(failClosed)}`,
    `failClosedReason: ${args.documentProfileRecall?.failClosedReason || "NONE"}`,
    `recallInjected: ${String(visibleRecall.injected)}`,
    `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
    `recallItemsCount: ${String(visibleRecall.items.length)}`,
    `documentProfileItemsCount: ${String(args.documentProfileRecall?.items.length || 0)}`,
    `strictRequestedMemoryOnly: ${String(visibleRecall.strictRequestedMemoryOnly)}`,
    `strictRequestedMemoryFilter: ${visibleRecall.strictRequestedMemoryFilter}`,
    `strictDocumentProfileFilter: ${requestedProfileIds.length > 0 ? "REQUESTED_PROFILE_SET_APPLIED" : "NO_REQUESTED_PROFILE_ID"}`,
    "",
    "2. Scope isolation",
    `tenantScoped: ${String(args.documentProfileRecall?.isolation.tenantScoped || false)}`,
    `workspaceScoped: ${String(args.documentProfileRecall?.isolation.workspaceScoped || false)}`,
    `projectScoped: ${String(args.documentProfileRecall?.isolation.projectScoped || false)}`,
    `docFamilyScoped: ${String(args.documentProfileRecall?.isolation.docFamilyScoped || false)}`,
    `rejectedByTenant: ${String(args.documentProfileRecall?.isolation.rejectedByTenant || 0)}`,
    `rejectedByWorkspace: ${String(args.documentProfileRecall?.isolation.rejectedByWorkspace || 0)}`,
    `rejectedByProject: ${String(args.documentProfileRecall?.isolation.rejectedByProject || 0)}`,
    `rejectedByDocFamily: ${String(args.documentProfileRecall?.isolation.rejectedByDocFamily || 0)}`,
    "",
    "3. Profili documentali richiamati",
    sections.join("\n").trim() || "NO_DOCUMENT_PROFILES",
    "",
    "4. Collegamento HBCE",
    `Human IPR: ${args.handoff.humanIpr || "NO_HUMAN_IPR"}`,
    `Runtime memory ID: ${args.memory.memoryId || "NO_RUNTIME_MEMORY_ID"}`,
    `Tenant: ${args.saasContext.tenantId || "NO_TENANT"}`,
    `Workspace: ${args.saasContext.workspaceId || "NO_WORKSPACE"}`,
    "",
    "5. Boundary",
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}

export function buildCyberneticDocumentMemoryRecallAnswer(args: CyberneticDocumentMemoryRecallAnswerInput): string {
  if (isMultiDocumentMemoryRecallRequested(args.message)) {
    return buildCyberneticMultiDocumentMemoryRecallAnswer(args);
  }

  const visibleRecall = filterIprRecallContextByRequestedMemoryId(args.message, args.recall);
  const primaryMemory = selectRequestedIprRecallItem(args.message, visibleRecall.items);
  const documentProfile = selectDocumentProfileRecallItem(args.documentProfileRecall, args.message);
  const linkedMemory = documentProfile ? findMatchingRecallMemoryItem(visibleRecall, documentProfile) : null;
  const memoryForStatus = linkedMemory || primaryMemory;
  const requestedMemoryIds = extractRequestedIprMemoryIds(args.message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(args.message);
  const visibleDocumentProfiles = documentProfile
    ? [documentProfile]
    : args.documentProfileRecall?.items || [];
  const visibleProfileIds = Array.from(
    new Set(visibleDocumentProfiles.map((item) => item.profileId).filter((item): item is string => Boolean(item)))
  );
  const visibleLinkedProfileCount = visibleDocumentProfiles.length;

  if (!documentProfile) {
    return [
      "CYBER_DOCUMENT_MEMORY_RECALL_NOT_FOUND",
      "DOCUMENT_MEMORY_RECALL_READY: false",
      "",
      `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
      `documentRegistry.status: ${documentProfileRecallRegistryStatus(args.documentProfileRecall)}`,
      `recallPolicyMode: ${args.documentProfileRecall?.recallPolicyMode || "UNSPECIFIED"}`,
      `projectId: ${args.documentProfileRecall?.projectId || args.saasContext.projectId || args.projectContext?.projectId || "NO_PROJECT_ID"}`,
      `documentModuleId: ${args.documentProfileRecall?.documentModuleId || args.saasContext.documentModuleId || args.projectContext?.documentModuleId || "NO_DOCUMENT_MODULE_ID"}`,
      `failClosed: ${String(args.documentProfileRecall?.failClosed || false)}`,
      `failClosedReason: ${args.documentProfileRecall?.failClosedReason || "NONE"}`,
      `requestedMemoryIds: ${requestedMemoryIds.join(", ") || "NO_REQUESTED_MEMORY_IDS"}`,
      `requestedDocumentProfileIds: ${requestedProfileIds.join(", ") || "NO_REQUESTED_DOCUMENT_PROFILE_IDS"}`,
      `memoryRecallStatus: ${visibleRecall.status}`,
      `memoryRecallInjected: ${String(visibleRecall.injected)}`,
      `documentProfileRecallStatus: ${args.documentProfileRecall?.status || "DOCUMENT_PROFILE_RECALL_NOT_EXECUTED"}`,
      `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
      `linkedProfileCount: ${String(args.documentProfileRecall?.items.length || 0)}`,
      `memoryIds: ${visibleRecall.memoryIds.join(", ") || "NO_MEMORY_IDS"}`,
      `strictRequestedMemoryOnly: ${String(visibleRecall.strictRequestedMemoryOnly)}`,
      `strictRequestedMemoryFilter: ${visibleRecall.strictRequestedMemoryFilter}`,
      `profileIds: ${args.documentProfileRecall?.profileIds.join(", ") || "NO_PROFILE_IDS"}`,
      `missingMemoryIds: ${args.documentProfileRecall?.missingMemoryIds.join(", ") || "NONE"}`,
      `missingProfileIds: ${args.documentProfileRecall?.missingProfileIds.join(", ") || "NONE"}`,
      args.documentProfileRecall?.error ? `Errore documentRegistry: ${args.documentProfileRecall.error}` : "Errore documentRegistry: none",
      "Motivo: nessun document_profiles ACTIVE/reusableInPrompt=true risulta collegato al memoryId o documentProfileId richiesto.",
      "legalCertification=false",
      "OPC=technical proof receipt only"
    ].join("\n");
  }

  const promptEligible = memoryForStatus?.memoryStatus
    ? normalizeText(memoryForStatus.memoryStatus) === "active"
    : true;
  const linkedProfileCount = visibleLinkedProfileCount || 1;
  const documentRegistryStatus = documentProfileRecallRegistryStatus(args.documentProfileRecall);

  return [
    "CYBER_DOCUMENT_MEMORY_RECALL_READY",
    "DOCUMENT_MEMORY_RECALL_READY: true",
    "MEMORY_CHAIN_RECALL_READY: true",
    "",
    "1. Memoria IPR richiamata",
    `memoryId: ${documentProfile.memoryId || memoryForStatus?.memoryId || requestedMemoryIds[0] || "NO_MEMORY_ID"}`,
    `sourceSavedChatId: ${documentProfile.sourceSavedChatId || memoryForStatus?.sourceSavedChatId || "NO_SAVED_CHAT"}`,
    `sourceThreadId: ${memoryForStatus?.sourceThreadId || memoryForStatus?.sessionId || visibleRecall.sessionId}`,
    "",
    "2. Triade collegata",
    `EVT collegato: ${documentProfile.lastEvtId || memoryForStatus?.lastEvtId || "NO_EVT_IN_RECALL_RECORD"}`,
    `OPC collegato: ${documentProfile.lastOpcProofId || memoryForStatus?.lastOpcProofId || "NO_OPC_IN_RECALL_RECORD"}`,
    `OPC chain hash: ${memoryForStatus?.lastOpcChainHash || "NO_OPC_CHAIN_HASH_IN_RECALL_RECORD"}`,
    "",
    "3. Document Registry collegato",
    `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    `documentRegistry.status: ${documentRegistryStatus}`,
    `recallPolicyMode: ${args.documentProfileRecall?.recallPolicyMode || "UNSPECIFIED"}`,
    `projectId: ${args.documentProfileRecall?.projectId || args.saasContext.projectId || args.projectContext?.projectId || "NO_PROJECT_ID"}`,
    `documentModuleId: ${args.documentProfileRecall?.documentModuleId || args.saasContext.documentModuleId || args.projectContext?.documentModuleId || "NO_DOCUMENT_MODULE_ID"}`,
    `linkedProfileCount: ${String(linkedProfileCount)}`,
    `documentProfileId: ${documentProfile.profileId || requestedProfileIds[0] || "NO_DOCUMENT_PROFILE_ID"}`,
    `profileId: ${documentProfile.profileId || requestedProfileIds[0] || "NO_DOCUMENT_PROFILE_ID"}`,
    `filename: ${documentProfile.filename || "NO_FILENAME"}`,
    `fileHash: ${documentProfile.fileHash || "NO_FILE_HASH"}`,
    `fileId: ${documentProfile.fileId || "NO_FILE_ID"}`,
    `textStatus: ${documentProfile.textStatus || "UNKNOWN_TEXT_STATUS"}`,
    `textLength: ${String(documentProfile.textLength ?? "UNKNOWN_TEXT_LENGTH")}`,
    `mimeType: ${documentProfile.mimeType || "UNKNOWN_MIME_TYPE"}`,
    "",
    "4. Profilo documento",
    `docFamily: ${documentProfile.docFamily || "UNKNOWN_DOC_FAMILY"}`,
    `volume: ${documentProfile.volume || "UNKNOWN_VOLUME"}`,
    `title: ${documentProfile.title || "UNKNOWN_TITLE"}`,
    documentProfile.subtitle ? `subtitle: ${documentProfile.subtitle}` : "subtitle: none",
    `canonicalAxis: ${documentProfile.canonicalAxis || "NO_CANONICAL_AXIS"}`,
    `summary: ${documentProfile.summary || "NO_DOCUMENT_PROFILE_SUMMARY"}`,
    ...useEuropeanFederationProfileSummaryHardRepairLines(documentProfile),
    ...hbceAiEcosystemProfileSummaryHardRepairLines(documentProfile),
    `keyTerms: ${documentProfile.keyTerms.join(", ") || "NO_KEY_TERMS"}`,
    `semanticTerms: ${serializeDocumentSemanticTerms(documentProfile.semanticTerms)}`,
    "",
    "5. Stato memoria e recall",
    `status memoria: ${memoryForStatus?.memoryStatus || "ACTIVE"}`,
    `promptEligible: ${String(promptEligible)}`,
    `reusableInPrompt: ${String(documentProfile.reusableInPrompt)}`,
    `quality: ${documentProfile.quality || memoryForStatus?.quality || "UNKNOWN"}`,
    `classification: ${memoryForStatus?.classification || "USER_SELECTED_CHAT_MEMORY"}`,
    `recallInjected: ${String(visibleRecall.injected)}`,
    `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
    `recallItemsCount: ${String(visibleRecall.items.length)}`,
    `memoryIds: ${visibleRecall.memoryIds.join(", ") || "NO_MEMORY_IDS"}`,
    `strictRequestedMemoryOnly: ${String(visibleRecall.strictRequestedMemoryOnly)}`,
    `strictRequestedMemoryFilter: ${visibleRecall.strictRequestedMemoryFilter}`,
    `profileIds: ${visibleProfileIds.join(", ") || "NO_PROFILE_IDS"}`,
    `missingMemoryIds: ${args.documentProfileRecall?.missingMemoryIds.join(", ") || "NONE"}`,
    `missingProfileIds: ${args.documentProfileRecall?.missingProfileIds.join(", ") || "NONE"}`,
    `failClosed: ${String(args.documentProfileRecall?.failClosed || false)}`,
    `strictDocumentProfileFilter: ${requestedProfileIds.length > 0 ? "REQUESTED_PROFILE_ID_APPLIED" : "NO_REQUESTED_PROFILE_ID"}`,
    "",
    "6. Sintesi operativa della memoria",
    isUseEuropeanFederationVolumeVProfileRecord(documentProfile.publicProfile || {})
      ? USE_VOLUME_V_OPERATIONAL_MEMORY_SUMMARY
      : isUseEuropeanFederationVolumeIVProfileRecord(documentProfile.publicProfile || {})
        ? USE_VOLUME_IV_OPERATIONAL_MEMORY_SUMMARY
        : isUseEuropeanFederationVolumeIIIProfileRecord(documentProfile.publicProfile || {})
        ? USE_VOLUME_III_OPERATIONAL_MEMORY_SUMMARY
        : isUseEuropeanFederationVolumeIIProfileRecord(documentProfile.publicProfile || {})
        ? USE_VOLUME_II_OPERATIONAL_MEMORY_SUMMARY
        : isUseEuropeanFederationVolumeIProfileRecord(documentProfile.publicProfile || {}) &&
            isNoActiveFileMemorySummary(memoryForStatus?.memorySummary || null)
          ? USE_VOLUME_I_OPERATIONAL_MEMORY_SUMMARY
          : memoryForStatus?.memorySummary || memoryForStatus?.memoryTitle || documentProfile.summary || "Sintesi memoria documentale non disponibile nel record pubblico.",
    "",
    "7. Collegamento HBCE",
    `Human IPR: ${args.handoff.humanIpr || "NO_HUMAN_IPR"}`,
    `Runtime memory ID: ${args.memory.memoryId || "NO_RUNTIME_MEMORY_ID"}`,
    `Tenant: ${args.saasContext.tenantId || "NO_TENANT"}`,
    `Workspace: ${args.saasContext.workspaceId || "NO_WORKSPACE"}`,
    `Document registry: ${documentRegistryStatus}; linkedProfileCount=${String(linkedProfileCount)} after requested documentProfileId filtering.`,
    "",
    "8. Boundary",
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}
