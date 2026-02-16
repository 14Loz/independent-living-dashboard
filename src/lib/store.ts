export type CostModelInputs = {
  // Income
  salaryGrossAnnual: number;   // user input
  otherIncomeMonthly: number;  // user input
  useAutoTax: boolean;         // user input
  netIncomeMonthlyManual: number; // user input if not auto

  // Housing & bills
  rentWeekly: number;
  utilitiesMonthly: number;
  internetMonthly: number;
  phoneMonthly: number;
  insuranceMonthly: number;

  // Living
  groceriesWeekly: number;
  transportMonthly: number;
  healthMonthly: number;
  subscriptionsMonthly: number;
  personalMonthly: number;

  // Obligations
  hecsMonthly: number;
  loansMonthly: number;

  // Buffers
  emergencyBufferMonthly: number;
  otherMonthly: number;
};

export const DEFAULT_INPUTS: CostModelInputs = {
  salaryGrossAnnual: 95000,
  otherIncomeMonthly: 0,
  useAutoTax: true,
  netIncomeMonthlyManual: 6000,

  rentWeekly: 650,
  utilitiesMonthly: 260,
  internetMonthly: 85,
  phoneMonthly: 60,
  insuranceMonthly: 50,

  groceriesWeekly: 180,
  transportMonthly: 380,
  healthMonthly: 120,
  subscriptionsMonthly: 40,
  personalMonthly: 120,

  hecsMonthly: 0,
  loansMonthly: 0,

  emergencyBufferMonthly: 250,
  otherMonthly: 150,
};

// Tiny localStorage-backed store (simple + reliable)
const KEY = "il_vic_cost_model_v1";

export function loadInputs(): CostModelInputs {
  if (typeof window === "undefined") return DEFAULT_INPUTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_INPUTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_INPUTS, ...parsed };
  } catch {
    return DEFAULT_INPUTS;
  }
}

export function saveInputs(inputs: CostModelInputs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(inputs));
}
