"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { loadInputs, type CostModelInputs } from "@/lib/store";
import { calcCostModel, fmtCurrencyAUD, fmtPct } from "@/lib/calc";

import { loadHome } from "@/lib/homeStore";
import { calcHomeOwnership, type HomeInputs } from "@/lib/homeCalc";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="text-sm font-semibold tracking-tight text-neutral-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-neutral-100 last:border-b-0">
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

export default function BriefPage() {
  const [cost, setCost] = useState<CostModelInputs | null>(null);
  const [home, setHome] = useState<HomeInputs | null>(null);

  useEffect(() => {
    setCost(loadInputs());
    setHome(loadHome());
  }, []);

  const costRes = useMemo(() => (cost ? calcCostModel(cost) : null), [cost]);
  const homeRes = useMemo(() => {
    if (!home || !costRes) return null;
    return calcHomeOwnership(home, costRes.incomeMonthly, costRes.essentialsMonthly);
  }, [home, costRes]);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "2-digit" });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      {/* Top controls (hidden in print) */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Policy Brief (Print to PDF)
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => window.print()}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="mx-auto max-w-4xl px-4 py-8 print:py-0">
        {/* Header */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs text-neutral-500">STATE SNAPSHOT</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                Cost of Living & Housing Affordability (Victoria)
              </h1>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                This brief summarises an input-driven model of independent living costs and first-home feasibility.
                It is designed to be transparent, adjustable, and suitable for constituency-level discussion.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">Generated</div>
              <div className="text-sm font-semibold text-neutral-900">{today}</div>
              <div className="mt-2 text-xs text-neutral-500">Model version</div>
              <div className="text-sm font-semibold text-neutral-900">v0.1</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {/* Key Findings */}
          <Section title="Key outputs (monthly)">
            {!costRes ? (
              <div className="text-sm text-neutral-600">Loading inputs…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Net income</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtCurrencyAUD(costRes.incomeMonthly)}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Essential costs</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtCurrencyAUD(costRes.essentialsMonthly)}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Disposable remainder</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtCurrencyAUD(costRes.disposableMonthly)}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Stress ratio</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtPct(costRes.stressRatio)}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Breakdown */}
          <Section title="Cost breakdown (monthly)">
            {!costRes ? (
              <div className="text-sm text-neutral-600">Loading…</div>
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-white p-1">
                <div className="px-3">
                  <StatRow label="Housing & bills" value={fmtCurrencyAUD(costRes.breakdown.housingMonthly)} />
                  <StatRow label="Living essentials" value={fmtCurrencyAUD(costRes.breakdown.livingMonthly)} />
                  <StatRow label="Obligations" value={fmtCurrencyAUD(costRes.breakdown.obligationsMonthly)} />
                  <StatRow label="Buffers / misc" value={fmtCurrencyAUD(costRes.breakdown.buffersMonthly)} />
                </div>
              </div>
            )}
          </Section>

          {/* Home Ownership (if available) */}
          <Section title="First-home feasibility (estimate)">
            {!homeRes ? (
              <div className="text-sm text-neutral-600">
                Home Ownership inputs not loaded yet — fill the Home Ownership tab for full outputs.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Upfront required</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtCurrencyAUD(homeRes.upfrontTotal)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Deposit + duty + LMI + fees − FHOG
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Monthly mortgage repayment</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtCurrencyAUD(homeRes.monthlyRepayment)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Stress +2%: {fmtCurrencyAUD(homeRes.monthlyRepaymentStress2)}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Max safe repayment (model)</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">
                    {fmtCurrencyAUD(homeRes.maxSafeRepayment)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Based on leftover after essentials + income cap
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-500">Realistic outcome (indicative)</div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">
                    {homeRes.likelyType}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">
                    {homeRes.likelySizeLow}–{homeRes.likelySizeHigh} m² • {homeRes.likelyBedsLow} to {homeRes.likelyBedsHigh}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Methodology */}
          <Section title="Notes & methodology">
            <div className="text-sm text-neutral-700 leading-relaxed space-y-2">
              <p>
                This model is input-driven and intended to illustrate how essential costs interact with net income,
                and how home ownership requirements (deposit, duty, LMI, fees) affect feasibility.
              </p>
              <p>
                Duty and LMI values are estimates; for exact duty outcomes, refer to the official State Revenue Office calculator.
              </p>
            </div>
          </Section>

          {/* Footer */}
          <div className="text-xs text-neutral-500 leading-relaxed">
            Prepared for civic discussion • This brief is not financial advice • Figures are indicative and depend on assumptions and inputs.
          </div>
        </div>
      </div>
    </div>
  );
}
