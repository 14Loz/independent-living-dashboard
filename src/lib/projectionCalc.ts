import { calcCostModel, toMonthlyFromWeekly } from "./calc";
import type { CostModelInputs } from "./store";
import type { HomeInputs } from "./homeCalc";
import { monthlyRepaymentPI } from "./homeCalc";

export type ProjectionInputs = {
  years: number;

  wageGrowthPct: number;      // annual
  inflationPct: number;       // annual (non-rent essentials)
  rentGrowthPct: number;      // annual
  propertyGrowthPct: number;  // annual

  savePctOfDisposable: number; // % of disposable saved
  savingsReturnPct: number;    // annual

  interestRatePct: number;
  termYears: number;
};

export const DEFAULT_PROJ: ProjectionInputs = {
  years: 10,
  wageGrowthPct: 3.0,
  inflationPct: 2.5,
  rentGrowthPct: 4.0,
  propertyGrowthPct: 5.0,
  savePctOfDisposable: 70,
  savingsReturnPct: 2.0,
  interestRatePct: 6.5,
  termYears: 30,
};

export type ProjectionPoint = {
  year: number;

  netIncomeMonthly: number;
  essentialsMonthly: number;
  rentMonthly: number;
  disposableMonthly: number;

  propertyPrice: number;
  depositTarget: number;
  savingsBalance: number;
  depositGap: number;

  monthlyRepaymentAtThatPrice: number;
  repaymentStressRatio: number;
};

function grow(value: number, annualPct: number, year: number) {
  return value * Math.pow(1 + annualPct / 100, year);
}

export function projectAffordability(
  costInputs: CostModelInputs,
  homeInputs: HomeInputs,
  p: ProjectionInputs
): ProjectionPoint[] {
  const base = calcCostModel(costInputs);

  const baseRentMonthly = toMonthlyFromWeekly(costInputs.rentWeekly);
  const baseEssentialsMonthly = base.essentialsMonthly;
  const baseNonRentEssentialsMonthly = Math.max(0, baseEssentialsMonthly - baseRentMonthly);
  const baseNetIncomeMonthly = base.incomeMonthly;

  const basePropertyPrice = homeInputs.purchasePrice;
  const depositPct = homeInputs.depositPct / 100;

  const points: ProjectionPoint[] = [];
  let savingsBalance = homeInputs.savingsAvailable || 0;

  for (let y = 0; y <= p.years; y++) {
    const netIncomeMonthly = grow(baseNetIncomeMonthly, p.wageGrowthPct, y);

    const rentMonthly = grow(baseRentMonthly, p.rentGrowthPct, y);
    const nonRentEssentialsMonthly = grow(baseNonRentEssentialsMonthly, p.inflationPct, y);
    const essentialsMonthly = rentMonthly + nonRentEssentialsMonthly;

    const disposableMonthly = netIncomeMonthly - essentialsMonthly;

    const savedMonthly = Math.max(0, disposableMonthly) * (p.savePctOfDisposable / 100);

    // apply savings return once per year (simple/transparent)
    if (y > 0) savingsBalance = savingsBalance * (1 + p.savingsReturnPct / 100);
    savingsBalance += savedMonthly * 12;

    const propertyPrice = grow(basePropertyPrice, p.propertyGrowthPct, y);
    const depositTarget = propertyPrice * depositPct;
    const depositGap = Math.max(0, depositTarget - savingsBalance);

    const loanAmount = Math.max(0, propertyPrice - depositTarget);
    const monthlyRepaymentAtThatPrice = monthlyRepaymentPI(
      loanAmount,
      p.interestRatePct,
      p.termYears
    );

    const repaymentStressRatio =
      netIncomeMonthly > 0 ? monthlyRepaymentAtThatPrice / netIncomeMonthly : 0;

    points.push({
      year: y,
      netIncomeMonthly,
      essentialsMonthly,
      rentMonthly,
      disposableMonthly,

      propertyPrice,
      depositTarget,
      savingsBalance,
      depositGap,

      monthlyRepaymentAtThatPrice,
      repaymentStressRatio,
    });
  }

  return points;
}
