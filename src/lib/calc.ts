import type { CostModelInputs } from "./store";

// Simple, transparent estimate (placeholder). We’ll refine later.
// For now: apply a flat effective tax rate to be conservative and avoid over-promising.
export function estimateNetMonthlyFromGross(grossAnnual: number) {
  const grossMonthly = grossAnnual / 12;
  const effectiveTaxRate = 0.27; // conservative placeholder
  const netMonthly = grossMonthly * (1 - effectiveTaxRate);
  return netMonthly;
}

export function toMonthlyFromWeekly(weekly: number) {
  return (weekly * 52) / 12;
}

export function calcCostModel(i: CostModelInputs) {
  const netMonthly =
    i.useAutoTax ? estimateNetMonthlyFromGross(i.salaryGrossAnnual) : i.netIncomeMonthlyManual;

  const incomeMonthly = netMonthly + i.otherIncomeMonthly;

  const housingMonthly =
    toMonthlyFromWeekly(i.rentWeekly) +
    i.utilitiesMonthly +
    i.internetMonthly +
    i.phoneMonthly +
    i.insuranceMonthly;

  const livingMonthly =
    toMonthlyFromWeekly(i.groceriesWeekly) +
    i.transportMonthly +
    i.healthMonthly +
    i.subscriptionsMonthly +
    i.personalMonthly;

  const obligationsMonthly = i.hecsMonthly + i.loansMonthly;

  const buffersMonthly = i.emergencyBufferMonthly + i.otherMonthly;

  const essentialsMonthly = housingMonthly + livingMonthly + obligationsMonthly + buffersMonthly;

  const disposableMonthly = incomeMonthly - essentialsMonthly;

  const stressRatio = incomeMonthly > 0 ? essentialsMonthly / incomeMonthly : 0;

  return {
    incomeMonthly,
    essentialsMonthly,
    disposableMonthly,
    stressRatio,
    breakdown: {
      housingMonthly,
      livingMonthly,
      obligationsMonthly,
      buffersMonthly,
    },
  };
}

export function fmtCurrencyAUD(v: number) {
  return v.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function fmtPct(v: number) {
  return `${Math.round(v * 100)}%`;
}
