--- app_api_files_B2G_TECHNICAL_STACK_CLASSIFIER_LIB_v6_5.ts
+++ app/api/files/route.ts (B2G_TECHNICAL_MEMORY_COLLAPSE_v6_6)
@@ -21,13 +21,19 @@
   buildHbceB2gTechnicalStackProfileMetadata,
   type HbceB2gTechnicalStackClassification
 } from "@/lib/hbce-b2g-technical-stack-classifier";
+import {
+  HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
+  HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
+  buildHbceB2gTechnicalMemoryCollapse,
+  toPublicHbceB2gTechnicalMemoryPayload
+} from "@/lib/hbce-b2g-technical-memory-collapse";
 
 
 export const runtime = "nodejs";
 export const dynamic = "force-dynamic";
 
 
-const FILE_ROUTE_REVISION = "HBCE-API-FILES-DOCUMENT-PROFILE-REGISTRY-v2-DOCUMENT_PROFILE_CANONICAL_FIX-v3-ALIEN_CODE_V4_PROFILE_FIX-v4-PORTALE_V5_EMPTY_RESPONSE_GUARD-v5_1-LONG_DOCUMENT_FULL_INGESTION_ENGINE-v6_0-LONG_DOCUMENT_PERSISTENT_CHUNKS-v6_1-SELF_DIAGNOSTIC_ENDPOINT-v6_2-LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_3-QPCCF_TECHNICAL_STACK_METADATA_LOCK-v6_4-B2G_TECHNICAL_STACK_CLASSIFIER_LIB-v6_5";
+const FILE_ROUTE_REVISION = "HBCE-API-FILES-DOCUMENT-PROFILE-REGISTRY-v2-DOCUMENT_PROFILE_CANONICAL_FIX-v3-ALIEN_CODE_V4_PROFILE_FIX-v4-PORTALE_V5_EMPTY_RESPONSE_GUARD-v5_1-LONG_DOCUMENT_FULL_INGESTION_ENGINE-v6_0-LONG_DOCUMENT_PERSISTENT_CHUNKS-v6_1-SELF_DIAGNOSTIC_ENDPOINT-v6_2-LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_3-QPCCF_TECHNICAL_STACK_METADATA_LOCK-v6_4-B2G_TECHNICAL_STACK_CLASSIFIER_LIB-v6_5-B2G_TECHNICAL_MEMORY_COLLAPSE-v6_6";
 const DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION = "LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_3";
 const DOCUMENT_CHUNK_PERSISTENCE_SCOPE = "HUMAN_IPR_TENANT_WORKSPACE_PROFILE_FILE_ID_FILE_HASH_CHUNK";
 const DOCUMENT_CHUNK_DEPLOY_PROOF_REVISION = "FILES_ROUTE_DEPLOY_PROOF_AND_CHUNK_DB_DIAGNOSTIC-v6_3_3";
@@ -253,6 +259,7 @@
   durationMs: number;
   profile: Record<string, unknown> | null;
   chunks: DocumentChunkPersistenceResult | null;
+  technicalMemory: Record<string, unknown> | null;
   input: {
     docFamily: string | null;
     volume: string | null;
@@ -288,7 +295,7 @@
   keyTerms: string[];
 };
 
-const DOCUMENT_PROFILE_CANONICAL_FIX_REVISION = "DOCUMENT_PROFILE_PORTALE_V5_EMPTY_RESPONSE_GUARD_v5_1-QPCCF_TECHNICAL_STACK_METADATA_LOCK_v6_4-B2G_TECHNICAL_STACK_CLASSIFIER_LIB_v6_5";
+const DOCUMENT_PROFILE_CANONICAL_FIX_REVISION = "DOCUMENT_PROFILE_PORTALE_V5_EMPTY_RESPONSE_GUARD_v5_1-QPCCF_TECHNICAL_STACK_METADATA_LOCK_v6_4-B2G_TECHNICAL_STACK_CLASSIFIER_LIB_v6_5-B2G_TECHNICAL_MEMORY_COLLAPSE_v6_6";
 const QPCCF_TECHNICAL_STACK_METADATA_LOCK_REVISION = "QPCCF_TECHNICAL_STACK_METADATA_LOCK_v6_4";
 const QPCCF_DOC_FAMILY = "HBCE_JOKER_C2_B2G_TECHNICAL_STACK";
 const QPCCF_DOCUMENT_KIND = "TECHNICAL_GOVERNANCE_MODULE";
@@ -2456,6 +2463,92 @@
 }
 
 
+
+function buildB2gTechnicalMemoryCollapseForFile(
+  file: StoredRuntimeFile,
+  context: DocumentProfileContext,
+  documentProfileId: string | null,
+  documentProfileStatus: DocumentProfilePersistenceStatus | "PERSISTED" | null,
+  chunks: DocumentChunkPersistenceResult | null
+): Record<string, unknown> | null {
+  const classification = getHbceB2gTechnicalStackClassification(file);
+
+  if (!classification) {
+    return null;
+  }
+
+  const payload = buildHbceB2gTechnicalMemoryCollapse({
+    filename: file.name,
+    sourceFilename: file.name,
+    title: classification.title ?? inferDocumentTitle(file),
+    header: file.text.slice(0, 12000),
+    text: file.text.slice(0, 60000),
+    mimeType: file.mimeType,
+    documentProfileId,
+    documentProfileStatus,
+    fileHash: file.fileHash,
+    docFamily: classification.docFamily ?? inferDocumentFamily(file),
+    documentKind: classification.documentKind ?? QPCCF_DOCUMENT_KIND,
+    module: classification.module ?? undefined,
+    volume: classification.volume ?? inferDocumentVolume(file),
+    canonicalAxis: classification.canonicalAxis ?? inferCanonicalAxis(file),
+    textCoverageStatus: file.textCoverageStatus,
+    fullDocumentCoverage: file.fullDocumentCoverage,
+    documentChunksPersisted: chunks?.ok ?? file.documentChunksPersisted ?? false,
+    documentChunksPersistedCount: chunks?.persistedCount ?? file.documentChunksPersistedCount ?? null,
+    truncationDetected: file.fullDocumentCoverage !== true,
+    derivedFromHumanIpr: chunks?.derivedFromHumanIpr ?? context.humanIpr,
+    humanIpr: context.humanIpr,
+    runtimeIpr: context.runtimeIpr,
+    tenantId: context.tenantId,
+    workspaceId: context.workspaceId,
+    evtId: null,
+    opcId: null,
+    auditId: null,
+    usageId: null
+  });
+
+  return toPublicHbceB2gTechnicalMemoryPayload(payload);
+}
+
+
+function applyB2gTechnicalMemoryCollapseToInput(
+  input: DocumentProfileDatabaseInput,
+  technicalMemory: Record<string, unknown> | null
+): DocumentProfileDatabaseInput {
+  if (!technicalMemory) {
+    return input;
+  }
+
+  const existingMetadata =
+    input.documentMetadata && typeof input.documentMetadata === "object"
+      ? input.documentMetadata as Record<string, unknown>
+      : {};
+
+  return {
+    ...input,
+    documentMetadata: {
+      ...existingMetadata,
+      b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
+      b2gTechnicalMemoryStatus: technicalMemory.status ?? null,
+      b2gTechnicalMemoryReady: technicalMemory.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
+      b2gTechnicalMemoryReadyForIprSave: technicalMemory.readyForIprSave === true,
+      b2gTechnicalMemoryFailReason: technicalMemory.failReason ?? null,
+      b2gTechnicalMemoryType: technicalMemory.memoryType ?? "B2G_TECHNICAL_PROFILE_MEMORY",
+      b2gTechnicalMemoryMode: technicalMemory.memoryMode ?? "TECHNICAL_SYNTHESIS_ONLY",
+      b2gTechnicalMemoryNoQuantumStates: true,
+      b2gTechnicalMemoryNoQstateOutput: true,
+      b2gTechnicalMemoryNoCorpusCollapse: true,
+      b2gTechnicalMemoryNoRawTextPersistence: true,
+      b2gTechnicalMemoryNoSemanticEsoterologicalMemory: true,
+      b2gTechnicalMemory: technicalMemory,
+      legalCertification: false,
+      opc: "technical proof receipt only"
+    }
+  };
+}
+
+
 function buildDocumentProfilePersistenceInputSummary(input: DocumentProfileDatabaseInput, file: StoredRuntimeFile) {
   return {
     docFamily: input.docFamily ?? null,
@@ -3193,6 +3286,7 @@
         durationMs: readiness.initialization.durationMs,
         profile: null,
         chunks: null,
+        technicalMemory: null,
         input: buildDocumentProfilePersistenceInputSummary(input, file)
       };
     });
@@ -3214,7 +3308,17 @@
         : null;
       const resolvedProfileId = extractPersistedDocumentProfileId(canonicalPublicProfile, row, file, context);
       const chunks = await persistDocumentChunksForFile(file, context, resolvedProfileId);
-      const proofInput = applyDocumentChunkPersistenceProofToInput(input, chunks);
+      const technicalMemory = buildB2gTechnicalMemoryCollapseForFile(
+        file,
+        context,
+        resolvedProfileId,
+        "PERSISTED",
+        chunks
+      );
+      const proofInput = applyB2gTechnicalMemoryCollapseToInput(
+        applyDocumentChunkPersistenceProofToInput(input, chunks),
+        technicalMemory
+      );
       const proofResult = await upsertDocumentProfileToDatabase(proofInput);
       const proofRow = proofResult.rows[0] as Record<string, unknown> | undefined;
       const proofPublicProfile = proofRow
@@ -3241,6 +3345,7 @@
         durationMs: result.durationMs + chunks.durationMs + proofResult.durationMs,
         profile: publicProfile,
         chunks,
+        technicalMemory,
         input: buildDocumentProfilePersistenceInputSummary(proofInput, file)
       });
     } catch (error) {
@@ -3257,6 +3362,7 @@
         durationMs: 0,
         profile: null,
         chunks: null,
+        technicalMemory: null,
         input: buildDocumentProfilePersistenceInputSummary(input, file)
       });
     }
@@ -3979,6 +4085,11 @@
     volume: readRecordString(profile, "volume"),
     title: readRecordString(profile, "title"),
     profileStatus: readRecordString(profile, "profileStatus"),
+    b2gTechnicalMemoryStatus: readRecordString(metadata, "b2gTechnicalMemoryStatus"),
+    b2gTechnicalMemoryReady: metadata.b2gTechnicalMemoryReady === true,
+    b2gTechnicalMemoryReadyForIprSave: metadata.b2gTechnicalMemoryReadyForIprSave === true,
+    b2gTechnicalMemoryFailReason: readRecordString(metadata, "b2gTechnicalMemoryFailReason"),
+    b2gTechnicalMemoryCollapseRevision: readRecordString(metadata, "b2gTechnicalMemoryCollapseRevision"),
     routeVersion: readRecordString(metadata, "routeVersion"),
     textCoverageStatus: readRecordString(metadata, "textCoverageStatus"),
     fullDocumentCoverage: metadata.fullDocumentCoverage === true,
@@ -4099,6 +4210,11 @@
     documentOutlineSupported: true,
     canonicalOutlineDetectorActive: true,
     longDocumentChunkingSupported: true,
+    b2gTechnicalMemoryCollapseSupported: true,
+    b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
+    b2gTechnicalMemoryStatusReady: HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
+    b2gTechnicalMemoryNoQuantumStates: true,
+    b2gTechnicalMemoryNoCorpusCollapse: true,
     runtimeChunkStoreCount,
     totalDocumentChunks,
     persistedDocumentChunks,
@@ -4199,6 +4315,8 @@
     documentRegistry: "DOCUMENT_PROFILES",
     documentTextChunks: "document_text_chunks",
     cyberneticMethod: "FILE_UPLOAD_TO_FULL_TEXT_CHUNKS_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
+    b2gTechnicalMemoryCollapse: "B2G_TECHNICAL_PROFILE_MEMORY_READY",
+    b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
     legalCertification: false,
     opc: "technical proof receipt only"
   };
@@ -4311,6 +4429,13 @@
         chunkDatabaseVerified: profile.chunks?.databaseVerified ?? null,
         chunkVerificationCount: profile.chunks?.verificationCount ?? null,
         derivedFromHumanIpr: profile.chunks?.derivedFromHumanIpr ?? null,
+        b2gTechnicalMemoryReady: profile.technicalMemory?.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
+        b2gTechnicalMemoryStatus:
+          typeof profile.technicalMemory?.status === "string" ? profile.technicalMemory.status : null,
+        b2gTechnicalMemoryFailReason:
+          typeof profile.technicalMemory?.failReason === "string" ? profile.technicalMemory.failReason : null,
+        b2gTechnicalMemoryReadyForIprSave: profile.technicalMemory?.readyForIprSave === true,
+        b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
         alienCodeV4ProfileDetected:
           profile.input.docFamily === "CORPUS_ESOTEROLOGIA_ERMETICA" &&
           profile.input.volume === "V4" &&
@@ -4331,6 +4456,25 @@
     summary: buildSessionSummary(sessionId, nextFiles),
     files: summarizeFiles(nextFiles, false, false),
     documentProfiles,
+    b2gTechnicalMemories: documentProfiles
+      .map((profile) => profile.technicalMemory)
+      .filter((technicalMemory): technicalMemory is Record<string, unknown> => Boolean(technicalMemory)),
+    b2gTechnicalMemorySummary: {
+      attemptedCount: documentProfiles.filter((profile) => Boolean(profile.technicalMemory)).length,
+      readyCount: documentProfiles.filter(
+        (profile) => profile.technicalMemory?.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
+      ).length,
+      failCount: documentProfiles.filter(
+        (profile) =>
+          Boolean(profile.technicalMemory) &&
+          profile.technicalMemory?.status !== HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
+      ).length,
+      collapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
+      noQuantumStates: true,
+      noCorpusCollapse: true,
+      legalCertification: false,
+      opc: "technical proof receipt only"
+    },
     selfDiagnostic,
     diagnostic: selfDiagnostic,
     filesRouteDiagnostic: selfDiagnostic,
@@ -4409,6 +4553,20 @@
     summary: buildSessionSummary(sessionId, files),
     files: summarizeFiles(files, includeText, includeChunks),
     documentProfiles,
+    b2gTechnicalMemories:
+      documentProfiles && Array.isArray(documentProfiles.profiles)
+        ? documentProfiles.profiles
+            .map((profile) => {
+              const metadata =
+                profile.documentMetadata && typeof profile.documentMetadata === "object"
+                  ? profile.documentMetadata as Record<string, unknown>
+                  : {};
+              return metadata.b2gTechnicalMemory && typeof metadata.b2gTechnicalMemory === "object"
+                ? metadata.b2gTechnicalMemory as Record<string, unknown>
+                : null;
+            })
+            .filter((technicalMemory): technicalMemory is Record<string, unknown> => Boolean(technicalMemory))
+        : [],
     selfDiagnostic,
     diagnostic: selfDiagnostic,
     filesRouteDiagnostic: selfDiagnostic,
