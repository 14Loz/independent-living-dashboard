"use client";

import AppShell from "@/components/AppShell";

type SourceItem = {
  name: string;
  publisher: string;
  usedFor: string[];
  updateCadence?: string;
  url: string;
  notes?: string;
};

const SOURCES: SourceItem[] = [
  {
    name: "Consumer Price Index (CPI), Australia — Latest release",
    publisher: "Australian Bureau of Statistics (ABS)",
    usedFor: [
      "Baseline inflation context (CPI)",
      "Category context (e.g., Housing, Food & non-alcoholic beverages)",
    ],
    updateCadence: "Monthly/Quarterly releases (see ABS release schedule)",
    url: "https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release",
    notes:
      "Used for official inflation reference and category-level context. The model lets users override assumptions (e.g., ‘Eggflation’) for scenario exploration.",
  },
  {
    name: "Land transfer duty — Principal place of residence (current rates)",
    publisher: "State Revenue Office Victoria (SRO)",
    usedFor: ["Stamp duty estimates for PPR purchases (Victoria)"],
    updateCadence: "As published by SRO (current rates page)",
    url: "https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-transfer-duty-principal-place-residence-current-rates",
  },
  {
    name: "Land transfer duty — Non-principal place of residence (current rates)",
    publisher: "State Revenue Office Victoria (SRO)",
    usedFor: ["Stamp duty estimates for general purchases (Victoria)"],
    updateCadence: "As published by SRO (current rates page)",
    url: "https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-transfer-duty-non-principal-place-residence-current-rates",
  },
  {
    name: "First home buyer duty exemption or concession",
    publisher: "State Revenue Office Victoria (SRO)",
    usedFor: [
      "First home buyer duty thresholds (no duty up to $600k; reduced duty $600,001–$750k)",
      "Eligibility guidance reference",
    ],
    updateCadence: "As published by SRO",
    url: "https://www.sro.vic.gov.au/buying-property/land-transfer-stamp-duty/concessions-exemptions-and-waivers/first-home-buyers/first-home-buyer-duty-exemption-or-concession",
    notes:
      "Where exact duty varies by circumstances/contract date, users should verify with the official SRO calculator.",
  },
  {
    name: "Property sales statistics",
    publisher: "Valuer-General Victoria (VGV)",
    usedFor: [
      "Official sales statistics context",
      "Links to suburb-level medians and reporting",
    ],
    updateCadence: "Regular releases (see page)",
    url: "https://www.land.vic.gov.au/valuations/resources-and-reports/property-sales-statistics",
  },
  {
    name: "Victorian Property Sales Report — Median House by Suburb (time series)",
    publisher: "Victorian Government / Data Victoria (VGV sourced)",
    usedFor: ["Suburb-level median house prices (time series) for affordability mapping"],
    updateCadence: "Dataset updates (see Data.Vic resources)",
    url: "https://discover.data.vic.gov.au/dataset/victorian-property-sales-report-median-house-by-suburb-time-series",
    notes:
      "Used to compare user affordability against suburb medians. (Optional: add unit medians dataset too.)",
  },
  {
    name: "Vicmap Admin — Locality Polygon Aligned to Property",
    publisher: "Victorian Government / Vicmap (Data Victoria)",
    usedFor: ["Suburb/locality boundary polygons for map shading"],
    updateCadence: "Dataset updates (see Data.Vic resource)",
    url: "https://discover.data.vic.gov.au/dataset/vicmap-admin-locality-polygon-aligned-to-property",
  },
  {
    name: "ASGS Edition 3 — Digital boundary files (optional)",
    publisher: "Australian Bureau of Statistics (ABS)",
    usedFor: [
      "Optional mapping at SA2/LGA/other geographies if needed (not required for suburb/locality polygons)",
    ],
    updateCadence: "Edition-based (Jul 2021–Jun 2026 for ASGS Ed.3)",
    url: "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files",
  },
];

function Card({ s }: { s: SourceItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold tracking-tight">{s.name}</div>
          <div className="mt-1 text-xs text-white/50">{s.publisher}</div>
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition"
        >
          Open source
        </a>
      </div>

      <div className="mt-4 text-sm text-white/70">
        <div className="text-xs text-white/50">Used for</div>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {s.usedFor.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </div>

      {s.updateCadence ? (
        <div className="mt-4 text-xs text-white/55">
          <span className="text-white/40">Update cadence:</span> {s.updateCadence}
        </div>
      ) : null}

      {s.notes ? (
        <div className="mt-3 text-xs text-white/45 leading-relaxed">{s.notes}</div>
      ) : null}
    </div>
  );
}

export default function SourcesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-2 text-sm text-white/60">
            This page lists the public sources used to inform the dashboard’s assumptions and estimates.
            Each source links to the publisher so readers can verify independently.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {SOURCES.map((s) => (
            <Card key={s.url} s={s} />
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-sm text-white/60">
          Note: Some model outputs are estimates (e.g., LMI varies by lender; duty depends on contract details).
          Where official calculators exist, this dashboard links to them for verification.
        </div>
      </div>
    </AppShell>
  );
}
