import { Suspense } from "react";
import C2LexConsole from "./C2LexConsole";

export default function C2LexPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0f14] text-[#e8eef7]">
          <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
                HBCE Research
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                C2-Lex
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Caricamento della console semantica di comando...
              </p>
            </div>
          </section>
        </main>
      }
    >
      <C2LexConsole />
    </Suspense>
  );
}
