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
    <main className="h-screen overflow-hidden bg-[#212121] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#171717] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-white/10" />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-[#242424] px-3 py-3"
                >
                  <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#212121]">
          <header className="shrink-0 border-b border-white/10 px-4 py-3">
            <div className="h-5 w-56 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-white/10" />
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#171717] p-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                      <div className="mt-4 space-y-3">
                        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-11/12 animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#171717] p-4">
                      <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-[#1c1c1c] px-3 py-3"
                          >
                            <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
                            <div className="mt-3 h-4 w-24 animate-pulse rounded bg-white/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 px-4 py-4">
                <div className="mx-auto w-full max-w-3xl">
                  <div className="rounded-[28px] border border-white/10 bg-[#2f2f2f] p-3">
                    <div className="min-h-[110px] rounded-2xl px-3 py-3">
                      <div className="space-y-3">
                        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-4/6 animate-pulse rounded bg-white/10" />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="h-3 w-56 animate-pulse rounded bg-white/10" />
                      <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="hidden w-[320px] shrink-0 border-l border-white/10 bg-[#171717] xl:flex xl:flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <section
                      key={index}
                      className="rounded-2xl border border-white/10 bg-[#111111] p-4"
                    >
                      <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                      <div className="mt-4 space-y-2">
                        {Array.from({ length: 4 }).map((_, row) => (
                          <div
                            key={row}
                            className="rounded-xl bg-[#1c1c1c] px-3 py-3"
                          >
                            <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
                            <div className="mt-3 h-4 w-24 animate-pulse rounded bg-white/10" />
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
