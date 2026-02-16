"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";

import { loadInputs } from "@/lib/store";
import { calcCostModel, fmtCurrencyAUD, fmtPct } from "@/lib/calc";

import { DEFAULT_HOME, calcHomeOwnership, type HomeInputs } from "@/lib/homeCalc";
import { loadHome, saveHome } from "@/lib/homeStore";

function NumberField({
  label, value, onChange, suffix,
}: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-sm text-white/70">{label}</div>
      <div className="flex items-center gap-2">
        <input
          className="w-36 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-400/50"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix ? <div className="text-xs text-white/50">{suffix}</div> : null}
      </div>
    </div>
  );
}

function Toggle({
  label, checked, onChange, hint,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div>
        <div className="text-sm text-white/70">{label}</div>
        {hint ? <div className="text-xs text-white/45 mt-1">{hint}</div> : null}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={[
          "h-9 w-16 rounded-full border transition relative",
          checked ? "bg-cyan-500/25 border-cyan-400/30" : "bg-white/5 border-white/10",
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "absolute top-1 h-7 w-7 rounded-full transition",
            checked ? "left-8 bg-cyan-300" : "left-1 bg-white/60",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function HomeOwnershipPage() {
  const [home, setHome] = useState<HomeInputs>(DEFAULT_HOME);

  // Pull Cost Model to get net/essentials for “leftover after essentials”
  const [netMonthly, setNetMonthly] = useState(0);
  const [essentialsMonthly, setEssentialsMonthly] = useState(0);

  useEffect(() => {
    setHome(loadHome());

    const cost = loadInputs();
    const costRes = calcCostModel(cost);
    setNetMonthly(costRes.incomeMonthly);
    setEssentialsMonthly(costRes.essentialsMonthly);
  }, []);

  useEffect(() => saveHome(home), [home]);

  const result = useMemo(() => {
    return calcHomeOwnership(home, netMonthly, essentialsMonthly);
  }, [home, netMonthly, essentialsMonthly]);

  const depositPctOptions = [5, 10, 20];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Home Ownership</h1>
          <p className="mt-2 text-sm text-white/60">
            Uses your Cost Model to determine “leftover after essentials”, then models deposit, duty, LMI, fees, FHOG, and repayments.
          </p>
        </div>

        {/* Top results row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Upfront required (estimate)</div>
            <div className="mt-2 text-2xl font-semibold">{fmtCurrencyAUD(result.upfrontTotal)}</div>
            <div className="mt-2 text-xs text-white/45">
              Deposit + duty + LMI + fees − FHOG
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Monthly repayment (P&amp;I)</div>
            <div className="mt-2 text-2xl font-semibold">{fmtCurrencyAUD(result.monthlyRepayment)}</div>
            <div className="mt-2 text-xs text-white/45">
              Stress: +1% {fmtCurrencyAUD(result.monthlyRepaymentStress1)} • +2% {fmtCurrencyAUD(result.monthlyRepaymentStress2)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Max safe repayment (your rules)</div>
            <div className="mt-2 text-2xl font-semibold">{fmtCurrencyAUD(result.maxSafeRepayment)}</div>
            <div className="mt-2 text-xs text-white/45">
              Based on leftover after essentials + income cap
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Feasible today?</div>
            <div className="mt-2 text-2xl font-semibold">
              {result.repaymentFeasible ? "Likely feasible" : "Not feasible"}
            </div>
            <div className="mt-2 text-xs text-white/45">
              This compares repayment vs max safe repayment
            </div>
          </div>
        </div>

        {/* Inputs + Realistic outcome */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold tracking-tight">Purchase inputs</div>

            <NumberField
              label="Purchase price"
              value={home.purchasePrice}
              onChange={(v) => setHome({ ...home, purchasePrice: v })}
              suffix="AUD"
            />

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-sm text-white/70">Deposit %</div>
              <div className="flex gap-2">
                {depositPctOptions.map((p) => (
                  <button
                    key={p}
                    onClick={() => setHome({ ...home, depositPct: p })}
                    className={[
                      "rounded-lg px-3 py-2 text-sm border transition",
                      home.depositPct === p
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-white/10 text-white/60 hover:bg-white/5",
                    ].join(" ")}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <NumberField
              label="Savings available now"
              value={home.savingsAvailable}
              onChange={(v) => setHome({ ...home, savingsAvailable: v })}
              suffix="AUD"
            />

            <Toggle
              label="Principal Place of Residence (PPR)"
              checked={home.isPPR}
              onChange={(v) => setHome({ ...home, isPPR: v })}
              hint="Affects duty rates."
            />

            <Toggle
              label="First home buyer duty benefit"
              checked={home.isFirstHomeBuyer}
              onChange={(v) => setHome({ ...home, isFirstHomeBuyer: v })}
              hint="Exemption up to $600k; concession to $750k."
            />

            <Toggle
              label="FHOG eligible (new home ≤ $750k)"
              checked={home.fhogEligible}
              onChange={(v) => setHome({ ...home, fhogEligible: v })}
              hint="Simplified toggle (we’ll add full eligibility rules later)."
            />

            <Toggle
              label="Australian Gov 5% Deposit Scheme (no LMI)"
              checked={home.useGov5pctScheme}
              onChange={(v) => setHome({ ...home, useGov5pctScheme: v })}
              hint="If eligible, LMI can be avoided."
            />

            <NumberField
              label="Purchase fees (conveyancing etc.)"
              value={home.purchaseFees}
              onChange={(v) => setHome({ ...home, purchaseFees: v })}
              suffix="AUD"
            />

            <NumberField
              label="Moving costs"
              value={home.movingCosts}
              onChange={(v) => setHome({ ...home, movingCosts: v })}
              suffix="AUD"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold tracking-tight">Loan + lending assumptions</div>

            <NumberField
              label="Interest rate"
              value={home.interestRatePct}
              onChange={(v) => setHome({ ...home, interestRatePct: v })}
              suffix="%"
            />

            <NumberField
              label="Loan term"
              value={home.termYears}
              onChange={(v) => setHome({ ...home, termYears: v })}
              suffix="years"
            />

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs text-white/50">Cost Model context</div>
              <div className="mt-1 text-sm text-white/70">
                Net monthly income: <span className="font-semibold text-white">{fmtCurrencyAUD(netMonthly)}</span>
              </div>
              <div className="mt-1 text-sm text-white/70">
                Essentials monthly: <span className="font-semibold text-white">{fmtCurrencyAUD(essentialsMonthly)}</span>
              </div>
              <div className="mt-1 text-sm text-white/70">
                Essentials ratio: <span className="font-semibold text-white">{netMonthly ? fmtPct(essentialsMonthly / netMonthly) : "—"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div>
                <div className="text-sm text-white/70">Lending mode</div>
                <div className="text-xs text-white/45 mt-1">
                  Conservative = bank-like caps. Adjustable = you choose caps.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHome({ ...home, lendingMode: "conservative" })}
                  className={[
                    "rounded-lg px-3 py-2 text-sm border transition",
                    home.lendingMode === "conservative"
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-transparent border-white/10 text-white/60 hover:bg-white/5",
                  ].join(" ")}
                >
                  Conservative
                </button>
                <button
                  onClick={() => setHome({ ...home, lendingMode: "adjustable" })}
                  className={[
                    "rounded-lg px-3 py-2 text-sm border transition",
                    home.lendingMode === "adjustable"
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-transparent border-white/10 text-white/60 hover:bg-white/5",
                  ].join(" ")}
                >
                  Adjustable
                </button>
              </div>
            </div>

            {home.lendingMode === "adjustable" ? (
              <>
                <NumberField
                  label="Max repayment: % of leftover"
                  value={home.maxRepaymentFromLeftoverPct}
                  onChange={(v) => setHome({ ...home, maxRepaymentFromLeftoverPct: v })}
                  suffix="%"
                />
                <NumberField
                  label="Max repayment: % of net income"
                  value={home.maxRepaymentFromIncomePct}
                  onChange={(v) => setHome({ ...home, maxRepaymentFromIncomePct: v })}
                  suffix="%"
                />
              </>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50">
                Conservative caps: min(80% of leftover, 30% of net income).
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold tracking-tight">Realistic buy outcome (indicative)</div>
              <div className="mt-3 text-sm text-white/70">
                Likely type: <span className="font-semibold text-white">{result.likelyType}</span>
              </div>
              <div className="mt-2 text-sm text-white/70">
                Estimated internal area:{" "}
                <span className="font-semibold text-white">
                  {result.likelySizeLow}–{result.likelySizeHigh} m²
                </span>
              </div>
              <div className="mt-2 text-sm text-white/70">
                Rough bedrooms:{" "}
                <span className="font-semibold text-white">
                  {result.likelyBedsLow} to {result.likelyBedsHigh}
                </span>
              </div>
              <div className="mt-3 text-xs text-white/45 leading-relaxed">
                Duty and LMI outputs are estimates. For exact duty, reference the SRO calculator in Methodology.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs text-white/50">Duty (estimate)</div>
                <div className="mt-1 text-sm font-semibold">{fmtCurrencyAUD(result.dutyEstimate)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs text-white/50">LMI (estimate)</div>
                <div className="mt-1 text-sm font-semibold">{fmtCurrencyAUD(result.lmiEstimate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology links note */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-sm text-white/60">
          Duty rates and first-home thresholds are based on State Revenue Office (VIC) current rates and guidance. For exact duty for a specific contract date and situation, use the SRO calculator.
        </div>
      </div>
    </AppShell>
  );
}
