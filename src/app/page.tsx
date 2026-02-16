"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { loadInputs, type CostModelInputs } from "@/lib/store";
import { calcCostModel, fmtCurrencyAUD, fmtPct } from "@/lib/calc";

function Kpi({
  title,
  value,
  sub,
  gradient,
}: {
  title: string;
  value: string;
  sub: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl p-[1px] ${gradient}`}>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm">
        <div className="text-xs text-white/60">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 text-xs text-white/50">{sub}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [inputs, setInputs] = useState<CostModelInputs | null>(null);

  useEffect(() => {
    setInputs(loadInputs());
  }, []);

  const result = useMemo(() => {
    if (!inputs) return null;
    return calcCostModel(inputs);
  }, [inputs]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Enter inputs in Cost Model to generate live outputs across the dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi
            title="Net monthly income"
            value={result ? fmtCurrencyAUD(result.incomeMonthly) : "$—"}
            sub="After tax"
            gradient="bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/30"
          />

          <Kpi
            title="Essential costs"
            value={result ? fmtCurrencyAUD(result.essentialsMonthly) : "$—"}
            sub="Housing + living + obligations"
            gradient="bg-gradient-to-r from-cyan-500/35 to-blue-500/25"
          />

          <Kpi
            title="Disposable remainder"
            value={result ? fmtCurrencyAUD(result.disposableMonthly) : "$—"}
            sub="Left after essentials"
            gradient="bg-gradient-to-r from-emerald-500/25 to-cyan-500/25"
          />

          <Kpi
            title="Stress ratio"
            value={result ? fmtPct(result.stressRatio) : "—%"}
            sub="Essentials ÷ income"
            gradient="bg-gradient-to-r from-orange-500/30 to-rose-500/25"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
          <div className="text-sm font-semibold tracking-tight">
            Realistic outputs preview
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              Disposable monthly:
              <div className="mt-1 text-lg font-semibold">
                {result ? fmtCurrencyAUD(result.disposableMonthly) : "$—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              Financial pressure level:
              <div className="mt-1 text-lg font-semibold">
                {result
                  ? result.stressRatio > 0.7
                    ? "High pressure"
                    : result.stressRatio > 0.5
                    ? "Moderate"
                    : "Stable"
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
