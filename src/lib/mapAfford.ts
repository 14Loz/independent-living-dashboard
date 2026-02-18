import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";

import { calcCostModel } from "@/lib/calc";
import { calcHomeOwnership } from "@/lib/homeCalc";
import { loadInputs } from "@/lib/store";
import { loadHome } from "@/lib/homeStore";

export type MedianEntry = {
  house: number;
  unit: number | null; // ✅ allow null for unit (we'll add unit medians later)
};

export type AffordColor = "green" | "amber" | "orange" | "red" | "gray";

export function computeAffordabilityForLocality(
  localityName: string,
  median: MedianEntry | undefined,
  dwellingType: "house" | "unit"
) {
  // No median data
  if (!median) {
    return { color: "gray" as const, reason: "No median price data" };
  }

  const price =
    dwellingType === "house"
      ? median.house
      : median.unit ?? undefined; // ✅ unit may be null

  if (!price || !Number.isFinite(price) || price <= 0) {
    return { color: "gray" as const, reason: "No median for selected dwelling type" };
  }

  const costInputs = loadInputs();
  const homeInputs = loadHome();

  const costRes = calcCostModel(costInputs);

  // Use suburb median as “purchase price” for the ownership calc
  const homeWithPrice = { ...homeInputs, purchasePrice: price };

  const r = calcHomeOwnership(
    homeWithPrice,
    costRes.incomeMonthly,
    costRes.essentialsMonthly
  );

  const depositOk = (homeWithPrice.savingsAvailable || 0) >= r.upfrontTotal;
  const serviceOk = r.repaymentFeasible;

  let color: AffordColor = "red";
  if (depositOk && serviceOk) color = "green";
  else if (depositOk && !serviceOk) color = "amber";
  else if (!depositOk && serviceOk) color = "orange";
  else color = "red";

  return {
    color,
    reason: `Upfront ${depositOk ? "OK" : "Not OK"} • Service ${serviceOk ? "OK" : "Not OK"}`,
    upfrontTotal: r.upfrontTotal,
    repayment: r.monthlyRepayment,
    maxSafeRepayment: r.maxSafeRepayment,
    price,
    localityName,
  };
}

export function localityWithinKmOfStations(
  feature: Feature<Polygon | MultiPolygon>,
  stations: FeatureCollection,
  km: number
) {
  if (!km || km <= 0) return true;

  const centroid = turf.centroid(feature as any);

  for (const s of stations.features) {
    if (!s.geometry || s.geometry.type !== "Point") continue;

    const d = turf.distance(centroid as any, s as any, { units: "kilometers" });
    if (d <= km) return true;
  }

  return false;
}
