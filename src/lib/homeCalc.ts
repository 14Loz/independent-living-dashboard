// src/lib/homeCalc.ts
import { toMonthlyFromWeekly } from "./calc";

/**
 * VIC duty rates (General + PPR concessional) are based on SRO "current rates" pages.
 * - General duty rates: https://www.sro.vic.gov.au/.../land-transfer-duty-non-principal-place-residence-current-rates
 * - PPR concessional duty rates (up to $550k): https://www.sro.vic.gov.au/.../land-transfer-duty-principal-place-residence-current-rates
 * First home buyer duty: exemption up to $600k; concession $600,001–$750k (SRO page). Calculator uses a common linear taper.
 * - First home buyer eligibility summary: https://www.sro.vic.gov.au/.../first-home-buyer-duty-exemption-or-concession
 */

export type HomeInputs = {
  purchasePrice: number;

  // Deposit
  depositPct: number; // e.g. 5, 10, 20
  savingsAvailable: number; // cash available now (optional)

  // Buyer profile
  isPPR: boolean; // principal place of residence
  isFirstHomeBuyer: boolean; // first home buyer duty benefit (SRO eligibility)
  fhogEligible: boolean; // new home <= 750k etc (simplified toggle)

  // Scheme
  useGov5pctScheme: boolean; // if true: treat LMI as 0 (if eligible)

  // Loan assumptions
  interestRatePct: number; // e.g. 6.5
  termYears: number; // e.g. 30

  // Conservative vs adjustable lending
  lendingMode: "conservative" | "adjustable";
  // Adjustable assumptions
  maxRepaymentFromLeftoverPct: number; // e.g. 80% of leftover
  maxRepaymentFromIncomePct: number; // e.g. 30% of net income

  // Fees
  purchaseFees: number; // conveyancing, inspections, etc (user adjustable)
  movingCosts: number; // optional
};

export const DEFAULT_HOME: HomeInputs = {
  purchasePrice: 750000,

  depositPct: 10,
  savingsAvailable: 25000,

  isPPR: true,
  isFirstHomeBuyer: true,
  fhogEligible: false,

  useGov5pctScheme: false,

  interestRatePct: 6.5,
  termYears: 30,

  lendingMode: "conservative",
  maxRepaymentFromLeftoverPct: 80,
  maxRepaymentFromIncomePct: 30,

  purchaseFees: 3500,
  movingCosts: 1500,
};

export function monthlyRepaymentPI(loanAmount: number, annualRatePct: number, termYears: number) {
  const r = (annualRatePct / 100) / 12;
  const n = termYears * 12;
  if (loanAmount <= 0) return 0;
  if (r === 0) return loanAmount / n;
  return (loanAmount * r) / (1 - Math.pow(1 + r, -n));
}

/** Very rough LMI estimate by LVR bands (AU market varies by lender/product). User can override later. */
export function estimateLmi(loanAmount: number, purchasePrice: number) {
  const lvr = purchasePrice > 0 ? loanAmount / purchasePrice : 0;

  // conservative-ish bands (indicative)
  let pct = 0;
  if (lvr <= 0.80) pct = 0;
  else if (lvr <= 0.85) pct = 0.010;
  else if (lvr <= 0.90) pct = 0.018;
  else if (lvr <= 0.95) pct = 0.030;
  else pct = 0.040;

  return Math.max(0, loanAmount * pct);
}

/** VIC General duty rates (SRO current rates table). */
export function vicDutyGeneral(dutiableValue: number) {
  const v = dutiableValue;
  if (v <= 0) return 0;
  if (v <= 25_000) return 0.014 * v;
  if (v <= 130_000) return 350 + 0.024 * (v - 25_000);
  if (v <= 960_000) return 2870 + 0.06 * (v - 130_000);
  if (v <= 2_000_000) return 0.055 * v;
  return 110_000 + 0.065 * (v - 2_000_000);
}

/**
 * VIC PPR concessional duty rates (SRO) apply up to $550k; above that, general rates apply.
 */
export function vicDutyPPR(dutiableValue: number) {
  const v = dutiableValue;
  if (v <= 0) return 0;
  if (v <= 25_000) return 0.014 * v;
  if (v <= 130_000) return 350 + 0.024 * (v - 25_000);
  if (v <= 440_000) return 2870 + 0.05 * (v - 130_000);
  if (v <= 550_000) return 18_370 + 0.06 * (v - 440_000);
  return vicDutyGeneral(v);
}

/**
 * First home buyer duty: exemption up to $600k, concession $600,001–$750k.
 * SRO doesn't provide the exact taper formula on the summary page, so this uses a common linear taper:
 * - full duty at 750k
 * - 0 duty at 600k
 * This is marked "estimate" in UI and links to SRO calculator.
 */
export function vicDutyFirstHomeEstimate(dutiableValue: number, assumePPR: boolean) {
  const v = dutiableValue;
  if (v <= 600_000) return 0;

  const baseDuty = assumePPR ? vicDutyPPR(v) : vicDutyGeneral(v);

  if (v >= 750_000) return baseDuty;

  const t = (750_000 - v) / 150_000; // 1 at 600k, 0 at 750k
  const concession = baseDuty * t;
  return Math.max(0, baseDuty - concession);
}

export function bedroomBandFromSizeM2(sizeM2: number) {
  if (sizeM2 < 40) return "Studio (indicative)";
  if (sizeM2 < 60) return "1 bed (indicative)";
  if (sizeM2 < 90) return "2 bed (indicative)";
  if (sizeM2 < 120) return "3 bed (indicative)";
  return "3+ bed (indicative)";
}

export function estimateSizeBandFromBudget(maxPurchasePrice: number) {
  // Conservative “type” heuristic. We’ll refine later with suburb/median data if you want.
  let type = "Apartment / townhouse (indicative)";
  if (maxPurchasePrice >= 900_000) type = "House or larger townhouse (indicative)";
  else if (maxPurchasePrice >= 650_000) type = "Townhouse / unit (indicative)";
  else type = "Smaller unit / apartment (indicative)";

  // Size band heuristic (m²), tuned to feel realistic not optimistic.
  let sizeLow = 45;
  let sizeHigh = 75;

  if (maxPurchasePrice >= 900_000) {
    sizeLow = 110; sizeHigh = 180;
  } else if (maxPurchasePrice >= 650_000) {
    sizeLow = 70; sizeHigh = 120;
  } else if (maxPurchasePrice >= 500_000) {
    sizeLow = 55; sizeHigh = 90;
  } else {
    sizeLow = 40; sizeHigh = 70;
  }

  const bedLow = bedroomBandFromSizeM2(sizeLow);
  const bedHigh = bedroomBandFromSizeM2(sizeHigh);

  return { type, sizeLow, sizeHigh, bedLow, bedHigh };
}

export type HomeResult = {
  depositAmount: number;
  loanAmount: number;
  lmiEstimate: number;
  dutyEstimate: number;
  fhog: number;

  upfrontTotal: number;
  monthlyRepayment: number;
  monthlyRepaymentStress1: number;
  monthlyRepaymentStress2: number;

  // “Can you afford” lens
  maxSafeRepayment: number;
  repaymentFeasible: boolean;

  // “Realistic outcome”
  likelyType: string;
  likelySizeLow: number;
  likelySizeHigh: number;
  likelyBedsLow: string;
  likelyBedsHigh: string;
};

export function calcHomeOwnership(
  h: HomeInputs,
  netIncomeMonthly: number,
  essentialsMonthly: number
): HomeResult {
  const price = h.purchasePrice;

  const depositAmount = (price * (h.depositPct / 100));
  const loanAmount = Math.max(0, price - depositAmount);

  const dutyBase =
    h.isFirstHomeBuyer
      ? vicDutyFirstHomeEstimate(price, h.isPPR)
      : h.isPPR
        ? vicDutyPPR(price)
        : vicDutyGeneral(price);

  const fhog = h.fhogEligible ? 10_000 : 0; // VIC FHOG is $10k for eligible new homes (simplified toggle)

  const lmiEstimate = h.useGov5pctScheme ? 0 : estimateLmi(loanAmount, price);

  const upfrontTotal = depositAmount + dutyBase + lmiEstimate + h.purchaseFees + h.movingCosts - fhog;

  const monthlyRepayment = monthlyRepaymentPI(loanAmount, h.interestRatePct, h.termYears);
  const monthlyRepaymentStress1 = monthlyRepaymentPI(loanAmount, h.interestRatePct + 1, h.termYears);
  const monthlyRepaymentStress2 = monthlyRepaymentPI(loanAmount, h.interestRatePct + 2, h.termYears);

  const leftover = Math.max(0, netIncomeMonthly - essentialsMonthly);

  // C: Both (Conservative + Adjustable)
  // Conservative: max repayment is the minimum of:
  // - 80% of leftover (so you still have breathing room)
  // - 30% of net income
  // Adjustable: use user sliders
  const conservativeLeftoverPct = 0.80;
  const conservativeIncomePct = 0.30;

  const maxFromLeftover =
    leftover * (h.lendingMode === "conservative" ? conservativeLeftoverPct : (h.maxRepaymentFromLeftoverPct / 100));

  const maxFromIncome =
    netIncomeMonthly * (h.lendingMode === "conservative" ? conservativeIncomePct : (h.maxRepaymentFromIncomePct / 100));

  const maxSafeRepayment = Math.max(0, Math.min(maxFromLeftover, maxFromIncome));
  const repaymentFeasible = monthlyRepayment <= maxSafeRepayment;

  const outcome = estimateSizeBandFromBudget(price);

  return {
    depositAmount,
    loanAmount,
    lmiEstimate,
    dutyEstimate: dutyBase,
    fhog,

    upfrontTotal,
    monthlyRepayment,
    monthlyRepaymentStress1,
    monthlyRepaymentStress2,

    maxSafeRepayment,
    repaymentFeasible,

    likelyType: outcome.type,
    likelySizeLow: outcome.sizeLow,
    likelySizeHigh: outcome.sizeHigh,
    likelyBedsLow: outcome.bedLow,
    likelyBedsHigh: outcome.bedHigh,
  };
}
