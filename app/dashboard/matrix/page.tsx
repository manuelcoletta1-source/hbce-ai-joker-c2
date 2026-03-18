"use client";

import { useEffect, useMemo, useState } from "react";

type FederationProbe = {
  node_id: string;
  endpoint: string | null;
  reachable: boolean;
  http_status: number | null;
  latency_ms: number | null;
  checked_at: string;
  registry_status: string;
  trust_level: string;
  capabilities: string[];
  error?: string;
};

type FederationLiveResponse = {
  ok: boolean;
  network: string;
  checked_at: string;
  summary: {
    total_nodes: number;
    reachable_nodes: number;
    unreachable_nodes: number;
  };
  probes: FederationProbe[];
};

type FederationQueryNodeResponse = {
  node_id: string;
  success: boolean;
  response?: string;
  error?: string;
  trust_level?: string;
  score?: number;
  trust_score?: number;
  final_score?: number;
  signature_valid?: boolean;
};

type FederationQueryResponse = {
  ok: boolean;
  network: string;
  message: string;
  federation: {
    total_nodes: number;
    successful_nodes: number;
    failed_nodes: number;
    responses: FederationQueryNodeResponse[];
  };
  orchestrator: {
    winner: {
      node_id: string;
      trust_level?: string;
      score?: number;
      response?: string;
    } | null;
  };
  consensus: {
    consensus_text: string;
    models: string[];
    confidence: "low" | "medium" | "high";
  } | null;
};

const DEFAULT_QUERY = "analisi geopolitica europa oggi";

function statusTone(reachable: boolean) {
  return reachable
    ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
    : "text-rose-300 border-rose-500/30 bg-rose-500/10";
}

function confidenceTone(value?: string) {
  switch ((value || "").toLowerCase()) {
    case "high":
      return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
    case "medium":
      return "text-amber-300 border-amber-500/30 bg-amber-500/10";
    default:
      return "text-zinc-300 border-zinc-500/30 bg-zinc-500/10";
  }
}

function shortHashLike(value: string | null | undefined) {
  if (!value) return "n/a";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export default function MatrixDashboardPage() {
  const [live, setLive] = useState<FederationLiveResponse | null>(null);
  const [queryResult, setQueryResult] = useState<FederationQueryResponse | null>(null);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLive() {
    setLoadingLive(true);
    setError(null);

    try {
      const res = await fetch("/api/federation/live", {
        method: "GET",
        cache: "no-store"
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to load federation live status");
      }

      setLive(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown live status error");
    } finally {
      setLoadingLive(false);
    }
  }

  async function runFederationQuery(customQuery?: string) {
    const prompt = (customQuery ?? query).trim();
    if (!prompt) return;

    setLoadingQuery(true);
    setError(null);

    try {
      const res = await fetch("/api/federation/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: prompt
        })
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Federation query failed");
      }

      setQueryResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown federation query error");
    } finally {
      setLoadingQuery(false);
    }
  }

  useEffect(() => {
    loadLive();
    runFederationQuery(DEFAULT_QUERY);
  }, []);

  const probes = useMemo(() => live?.probes ?? [], [live]);
  const winner = queryResult?.orchestrator?.winner ?? null;
  const consensus = queryResult?.consensus ?? null;

  return (
    <main className="min-h-screen bg-[#06070b] text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 rounded-3xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
              Matrix Europa
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
              HBCE Federation
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            JOKER-C2 Matrix Dashboard
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
            Vista operativa della rete federata HBCE. La dashboard mostra stato live
            dei nodi, reachability, latenza, ranking dell&apos;orchestrator e risultato
            di consensus distribuito.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Network
              </div>
              <div className="mt-2 text-lg font-semibold text-cyan-200">
                {live?.network || "HBCE-MATRIX"}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Total Nodes
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {live?.summary.total_nodes ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Reachable Nodes
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-300">
                {live?.summary.reachable_nodes ?? "—"}
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Live Federation Status</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Stato in tempo reale dei nodi registrati nella rete HBCE.
                </p>
              </div>

              <button
                onClick={loadLive}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                {loadingLive ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid gap-4">
              {probes.map((probe) => (
                <div
                  key={probe.node_id}
                  className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {probe.node_id}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${statusTone(
                        probe.reachable
                      )}`}
                    >
                      {probe.reachable ? "reachable" : "offline"}
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                      {probe.trust_level}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Endpoint
                      </div>
                      <div className="mt-1 break-all text-zinc-200">
                        {probe.endpoint || "missing"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Latency
                      </div>
                      <div className="mt-1 text-zinc-200">
                        {probe.latency_ms ?? "—"} ms
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Registry Status
                      </div>
                      <div className="mt-1 text-zinc-200">{probe.registry_status}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        HTTP
                      </div>
                      <div className="mt-1 text-zinc-200">
                        {probe.http_status ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {probe.capabilities.map((capability) => (
                      <span
                        key={`${probe.node_id}-${capability}`}
                        className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>

                  {probe.error ? (
                    <div className="mt-3 text-xs text-rose-300">{probe.error}</div>
                  ) : null}
                </div>
              ))}

              {!loadingLive && probes.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-black/20 p-5 text-sm text-zinc-400">
                  No federation probes available.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-white">Federation Query</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Interroga l&apos;orchestrator distribuito e osserva winner e consensus.
            </p>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-4 min-h-[140px] w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-500/40"
              placeholder="Scrivi una query federata..."
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => runFederationQuery()}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                {loadingQuery ? "Running..." : "Run Federation Query"}
              </button>

              <button
                onClick={() => {
                  setQuery(DEFAULT_QUERY);
                  runFederationQuery(DEFAULT_QUERY);
                }}
                className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Winner Node
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {winner?.node_id || "No winner"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
                    Trust: {winner?.trust_level || "—"}
                  </span>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                    Score: {winner?.score ?? "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Consensus Confidence
                </div>
                <div className="mt-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${confidenceTone(
                      consensus?.confidence
                    )}`}
                  >
                    {consensus?.confidence || "n/a"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-zinc-400">
                  Models: {consensus?.models?.join(", ") || "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-white">Orchestrated Winner Output</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Risposta selezionata dal motore trust-weighted.
            </p>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
              {winner?.response || "No orchestrated winner response available."}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-white">Consensus Output</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Aggregazione delle risposte federate secondo il consensus engine.
            </p>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
              {consensus?.consensus_text || "No consensus available."}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <h2 className="text-lg font-semibold text-white">Node Response Ranking</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Ranking dei nodi secondo trust dinamico, signature validity e qualità risposta.
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800">
            <div className="grid grid-cols-6 gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs uppercase tracking-[0.18em] text-zinc-400">
              <div>Node</div>
              <div>Status</div>
              <div>Trust</div>
              <div>Base</div>
              <div>Final</div>
              <div>Signature</div>
            </div>

            {(queryResult?.federation.responses || []).map((item) => (
              <div
                key={item.node_id}
                className="grid grid-cols-6 gap-3 border-b border-zinc-900 px-4 py-3 text-sm text-zinc-200 last:border-b-0"
              >
                <div className="font-medium text-white">{item.node_id}</div>
                <div>{item.success ? "success" : "failed"}</div>
                <div>{shortHashLike(item.trust_level)}</div>
                <div>{item.score ?? "—"}</div>
                <div>{item.final_score ?? "—"}</div>
                <div>{item.signature_valid ? "valid" : "invalid"}</div>
              </div>
            ))}

            {(!queryResult?.federation.responses ||
              queryResult.federation.responses.length === 0) && (
              <div className="px-4 py-6 text-sm text-zinc-400">
                No node ranking available.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
