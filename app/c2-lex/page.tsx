import { Suspense } from "react";
import C2LexConsole from "./C2LexConsole";

export default function C2LexPage() {
  return (
    <Suspense fallback={<C2LexFallback />}>
      <C2LexConsole />
    </Suspense>
  );
}

function C2LexFallback() {
  return (
    <main className="h-screen overflow-hidden bg-black text-neutral-100">
      <div className="flex h-full">
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-[#0a0a0a] xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
              HBCE Research
            </div>
            <div className="mt-2 text-lg font-semibold text-white">C2-Lex</div>
            <div className="mt-1 text-sm text-neutral-400">
              Semantic command console
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="mb-3 px-2 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              Scenari
            </div>

            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#111111] px-3 py-3"
                >
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-4 w-40 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#0f0f0f]">
          <header className="shrink-0 border-b border-white/10 bg-[#0f0f0f] px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                  AI JOKER-C2 / IPR / HBCE
                </div>
                <div className="mt-1 h-6 w-64 animate-pulse rounded bg-white/10" />
              </div>

              <div className="hidden items-center gap-2 md:flex">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-full border border-white/10 bg-[#171717] px-3 py-2"
                  >
                    <div className="h-2 w-12 animate-pulse rounded bg-white/10" />
                    <div className="mt-2 h-3 w-16 animate-pulse rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                  <section className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      Contesto operativo
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-3"
                        >
                          <div className="h-2 w-20 animate-pulse rounded bg-white/10" />
                          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/10" />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-5">
                    <section className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                      <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                      <div className="mt-4 space-y-3">
                        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-4/6 animate-pulse rounded bg-white/10" />
                      </div>
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-[#141414] p-5">
                      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                      <div className="mt-4 space-y-3">
                        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-11/12 animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                      </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/10 bg-[#111111] p-4"
                        >
                          <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
                          <div className="mt-3 h-4 w-24 animate-pulse rounded bg-white/10" />
                        </div>
                      ))}
                    </section>
                  </section>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-[#0f0f0f]">
                <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3"
                        >
                          <div className="h-2 w-20 animate-pulse rounded bg-white/10" />
                          <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/10" />
                        </div>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#111111] p-3">
                      <div className="min-h-[120px] rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-4">
                        <div className="space-y-3">
                          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                          <div className="h-4 w-4/6 animate-pulse rounded bg-white/10" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="h-4 w-72 animate-pulse rounded bg-white/10" />
                        <div className="h-11 w-40 animate-pulse rounded-2xl bg-white/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="hidden w-[360px] shrink-0 border-l border-white/10 bg-[#0b0b0b] lg:flex lg:flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, panelIndex) => (
                    <section
                      key={panelIndex}
                      className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-4"
                    >
                      <div className="mb-3 h-3 w-32 animate-pulse rounded bg-white/10" />
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="rounded-2xl border border-white/10 bg-[#111111] px-3 py-3"
                          >
                            <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
                            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/10" />
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
