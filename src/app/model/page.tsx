"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_INPUTS, loadInputs, saveInputs, type CostModelInputs } from "@/lib/store";
import { calcCostModel, fmtCurrencyAUD, fmtPct } from "@/lib/calc";

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
          className="w-32 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-400/50"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix ? <div className="text-xs text-white/50">{suffix}</div> : null}
      </div>
    </div>
  );
}

export default function ModelPage() {
  const [inputs, setInputs] = useState<CostModelInputs>(DEFAULT_INPUTS);

  useEffect(() => {
    setInputs(loadInputs());
  }, []);

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  const r = useMemo(() => calcCostModel(inputs), [inputs]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Cost Model</h1>
          <p className="mt-2 text-sm text-white/60">
            Enter your income and expenses. Outputs update instantly and are saved in your browser.
          </p>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Net income (monthly)</div>
            <div className="mt-2 text-3xl font-semibold">{fmtCurrencyAUD(r.incomeMonthly)}</div>
            <div className="mt-2 text-xs text-white/50">Includes other income</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Essentials (monthly)</div>
            <div className="mt-2 text-3xl font-semibold">{fmtCurrencyAUD(r.essentialsMonthly)}</div>
            <div className="mt-2 text-xs text-white/50">Housing + living + obligations + buffers</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="text-xs text-white/60">Stress ratio</div>
            <div className="mt-2 text-3xl font-semibold">{fmtPct(r.stressRatio)}</div>
            <div className="mt-2 text-xs text-white/50">Essentials ÷ income</div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold tracking-tight">Income</div>

            <NumberField
              label="Salary (gross, annual)"
              value={inputs.salaryGrossAnnual}
              onChange={(v) => setInputs({ ...inputs, salaryGrossAnnual: v })}
              suffix="AUD/yr"
            />

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-sm text-white/70">Tax mode</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputs({ ...inputs, useAutoTax: true })}
                  className={[
                    "rounded-lg px-3 py-2 text-sm border transition",
                    inputs.useAutoTax
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-transparent border-white/10 text-white/60 hover:bg-white/5",
                  ].join(" ")}
                >
                  Auto (estimate)
                </button>
                <button
                  onClick={() => setInputs({ ...inputs, useAutoTax: false })}
                  className={[
                    "rounded-lg px-3 py-2 text-sm border transition",
                    !inputs.useAutoTax
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-transparent border-white/10 text-white/60 hover:bg-white/5",
                  ].join(" ")}
                >
                  Manual net
                </button>
              </div>
            </div>

            {!inputs.useAutoTax ? (
              <NumberField
                label="Net income (monthly, manual)"
                value={inputs.netIncomeMonthlyManual}
                onChange={(v) => setInputs({ ...inputs, netIncomeMonthlyManual: v })}
                suffix="AUD/mo"
              />
            ) : null}

            <NumberField
              label="Other income (monthly)"
              value={inputs.otherIncomeMonthly}
              onChange={(v) => setInputs({ ...inputs, otherIncomeMonthly: v })}
              suffix="AUD/mo"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold tracking-tight">Housing & Bills</div>
            <NumberField label="Rent" value={inputs.rentWeekly} onChange={(v) => setInputs({ ...inputs, rentWeekly: v })} suffix="AUD/wk" />
            <NumberField label="Utilities" value={inputs.utilitiesMonthly} onChange={(v) => setInputs({ ...inputs, utilitiesMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Internet" value={inputs.internetMonthly} onChange={(v) => setInputs({ ...inputs, internetMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Phone" value={inputs.phoneMonthly} onChange={(v) => setInputs({ ...inputs, phoneMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Insurance" value={inputs.insuranceMonthly} onChange={(v) => setInputs({ ...inputs, insuranceMonthly: v })} suffix="AUD/mo" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold tracking-tight">Living</div>
            <NumberField label="Groceries" value={inputs.groceriesWeekly} onChange={(v) => setInputs({ ...inputs, groceriesWeekly: v })} suffix="AUD/wk" />
            <NumberField label="Transport" value={inputs.transportMonthly} onChange={(v) => setInputs({ ...inputs, transportMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Health" value={inputs.healthMonthly} onChange={(v) => setInputs({ ...inputs, healthMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Subscriptions" value={inputs.subscriptionsMonthly} onChange={(v) => setInputs({ ...inputs, subscriptionsMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Personal" value={inputs.personalMonthly} onChange={(v) => setInputs({ ...inputs, personalMonthly: v })} suffix="AUD/mo" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold tracking-tight">Obligations & Buffers</div>
            <NumberField label="HECS" value={inputs.hecsMonthly} onChange={(v) => setInputs({ ...inputs, hecsMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Loans / credit" value={inputs.loansMonthly} onChange={(v) => setInputs({ ...inputs, loansMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Emergency buffer" value={inputs.emergencyBufferMonthly} onChange={(v) => setInputs({ ...inputs, emergencyBufferMonthly: v })} suffix="AUD/mo" />
            <NumberField label="Other (misc)" value={inputs.otherMonthly} onChange={(v) => setInputs({ ...inputs, otherMonthly: v })} suffix="AUD/mo" />

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs text-white/50">Disposable remainder (monthly)</div>
              <div className="mt-1 text-lg font-semibold">{fmtCurrencyAUD(r.disposableMonthly)}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
