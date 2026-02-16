"use client";

import AppShell from "@/components/AppShell";
import { useMemo, useState } from "react";
import { loadInputs } from "@/lib/store";
import { loadHome } from "@/lib/homeStore";
import { fmtCurrencyAUD, fmtPct } from "@/lib/calc";
import {
  DEFAULT_PROJ,
  projectAffordability,
  type ProjectionInputs,
} from "@/lib/projectionCalc";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-sm text-white/70">{label}</div>
      <div className="flex items-center gap-2">
        <input
          className="w-28 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-400/50"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix ? <div className="text-xs text-white/50">{suffix}</div> : null}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ProjectionsPage() {
  // C: presets + editable
  const MODERATE: ProjectionInputs = DEFAULT_PROJ;

  const CONSERVATIVE: ProjectionInputs = {
    ...DEFAULT_PROJ,
    wageGrowthPct: 2.0,
    inflationPct: 3.0,
    rentGrowthPct: 5.0,
    propertyGrowthPct: 6.0,
    savePctOfDisposable: 60,
    savingsReturnPct: 1.5,
  };

  const OPTIMISTIC: ProjectionInputs = {
    ...DEFAULT_PROJ,
    wageGrowthPct: 4.0,
    inflationPct: 2.0,
    rentGrowthPct: 3.0,
    propertyGrowthPct: 4.0,
    savePctOfDisposable: 80,
    savingsReturnPct: 3.0,
  };

  const [proj, setProj] = useState<ProjectionInputs>(MODERATE);

  const data = useMemo(() => {
    const cost = loadInputs();
    const home = loadHome();
    return projectAffordability(cost, home, proj);
  }, [proj]);

  const end = data[data.length - 1];

  // Find the first year where savings >= deposit target
  const yearReached = useMemo(() => {
    const hit = data.find((p) => p.depositGap <= 0);
    return hit ? hit.year : null;
  }, [data]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Projections</h1>
          <p className="mt-2 text-sm text-white/60">
            Use presets as baselines, then adjust assumptions. (Indicative outputs.)
          </p>
        </div>

        <Panel title="Assumptions (presets + editable)">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setProj(CONSERVATIVE)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Conservative
            </button>
            <button
              onClick={() => setProj(MODERATE)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Moderate (baseline)
            </button>
            <button
              onClick={() => setProj(OPTIMISTIC)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Optimistic
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <NumberField
              label="Years"
              value={proj.years}
              onChange={(v) => setProj({ ...proj, years: Math.max(1, Math.min(40, v)) })}
              suffix="yrs"
            />

            <NumberField label="Wage growth" value={proj.wageGrowthPct} onChange={(v) => setProj({ ...proj, wageGrowthPct: v })} suffix="%/yr" />
            <NumberField label="Inflation (non-rent)" value={proj.inflationPct} onChange={(v) => setProj({ ...proj, inflationPct: v })} suffix="%/yr" />
            <NumberField label="Rent growth" value={proj.rentGrowthPct} onChange={(v) => setProj({ ...proj, rentGrowthPct: v })} suffix="%/yr" />
            <NumberField label="Property growth" value={proj.propertyGrowthPct} onChange={(v) => setProj({ ...proj, propertyGrowthPct: v })} suffix="%/yr" />

            <NumberField label="Save % of disposable" value={proj.savePctOfDisposable} onChange={(v) => setProj({ ...proj, savePctOfDisposable: v })} suffix="%" />
            <NumberField label="Savings return" value={proj.savingsReturnPct} onChange={(v) => setProj({ ...proj, savingsReturnPct: v })} suffix="%/yr" />

            <NumberField label="Interest rate" value={proj.interestRatePct} onChange={(v) => setProj({ ...proj, interestRatePct: v })} suffix="%" />
            <NumberField label="Loan term" value={proj.termYears} onChange={(v) => setProj({ ...proj, termYears: v })} suffix="yrs" />
          </div>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 md:col-span-2">
            <div className="text-xs text-white/60">Deposit reached</div>
            <div className="mt-2 text-2xl font-semibold">
              {yearReached === 0 ? "Already reached" : yearReached !== null ? `Year ${yearReached}` : "Not reached in range"}
            </div>
            <div className="mt-2 text-xs text-white/45">
              Based on savings vs deposit target under selected assumptions
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">End-year savings</div>
            <div className="mt-2 text-2xl font-semibold">{fmtCurrencyAUD(end.savingsBalance)}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">End-year deposit gap</div>
            <div className="mt-2 text-2xl font-semibold">{fmtCurrencyAUD(end.depositGap)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel title="Income vs Essentials (monthly)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any) => fmtCurrencyAUD(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="netIncomeMonthly" name="Net income" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="essentialsMonthly" name="Essentials" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Deposit target vs Savings (annual)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any) => fmtCurrencyAUD(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="depositTarget" name="Deposit target" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="savingsBalance" name="Savings" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Property price (annual)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any) => fmtCurrencyAUD(Number(v))} />
                  <Line type="monotone" dataKey="propertyPrice" name="Property price" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Mortgage repayment stress (repayment ÷ income)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip formatter={(v: any) => fmtPct(Number(v))} />
                  <Line type="monotone" dataKey="repaymentStressRatio" name="Repayment ratio" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
