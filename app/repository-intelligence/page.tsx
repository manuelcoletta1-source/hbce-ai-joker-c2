"use client";

import { useState } from "react";

import { RuntimeScientificMethodDashboard } from "../../components/repository-intelligence/runtime-scientific-method-dashboard";

import {
  mapRuntimeScientificMethodResponse,
} from "../../runtime/orchestration/runtime-scientific-method.mapper";

export default function RepositoryIntelligencePage() {
  const [result, setResult] =
    useState<unknown>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  async function execute(): Promise<void> {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/runtime/repository-intelligence",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                identity: {
                  humanIpr:
                    "IPR-3",

                  runtimeIpr:
                    "IPR-AI-0001",

                  tenantId:
                    "HBCE",

                  workspaceId:
                    "DEFAULT",

                  sessionId:
                    crypto.randomUUID(),
                },

                mission:
                  "Repository Intelligence",

                idempotencyKey:
                  crypto.randomUUID(),

                humanAuthorization:
                  true,

                legalCertification:
                  false,

                repository: {
                  repositoryId:
                    "HBCE",

                  repositoryName:
                    "hbce-ai-joker-c2",

                  branch:
                    "main",

                  commitSha:
                    "LOCAL",

                  files: [],
                },
              }),
          },
        );

      const payload: unknown =
        await response.json();

      if (!response.ok) {
        throw new Error(
          `Repository Intelligence request failed with status ${response.status}.`,
        );
      }

      setResult(payload);
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Repository Intelligence request failed.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const mapped =
    mapRuntimeScientificMethodResponse(
      result,
    );

  return (
    <main
      className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            HERMETICUM B.C.E. · AI JOKER-C2
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Repository Intelligence
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Analisi read-only del repository, con
            proiezione scientifica governata,
            autorizzazione umana e boundary
            legalCertification=false.
          </p>

          <button
            type="button"
            onClick={execute}
            disabled={loading}
            className="mt-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Running..."
              : "Execute Repository Analysis"}
          </button>
        </header>

        {error !== null && (
          <section
            role="alert"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200"
          >
            <h2 className="font-semibold">
              Analysis failed
            </h2>

            <p className="mt-2">
              {error}
            </p>
          </section>
        )}

        {result === null &&
          error === null &&
          !loading && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
              Nessuna analisi eseguita. Premi il
              pulsante per interrogare il runtime.
            </section>
          )}

        {loading && (
          <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-sm text-cyan-100">
            Repository Intelligence in esecuzione.
            Il runtime sta elaborando la richiesta
            autorizzata.
          </section>
        )}

        {result !== null &&
          mapped.mapped &&
          mapped.model !== undefined && (
            <RuntimeScientificMethodDashboard
              model={mapped.model}
            />
          )}

        {result !== null &&
          !mapped.mapped && (
            <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-slate-900/70 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Repository Intelligence Diagnostic
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-200/80">
                  L&apos;endpoint ha risposto
                  correttamente, ma non ha ancora
                  restituito il nuovo Scientific
                  Method ViewModel. Viene mostrato
                  il JSON diagnostico originale.
                </p>
              </div>

              <pre className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs leading-5 text-slate-200">
                {JSON.stringify(
                  result,
                  null,
                  2,
                )}
              </pre>
            </section>
          )}

        <footer className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-xs leading-5 text-slate-500">
          Read Only · Human Authorization Required ·
          No Automatic Repository Mutation · OPC is a
          technical proof receipt only ·
          legalCertification=false
        </footer>
      </div>
    </main>
  );
}
