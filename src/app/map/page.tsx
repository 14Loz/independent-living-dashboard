"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";

import Map, { Layer, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import stations from "@/data/vic_train_stations_SAMPLE.json";
import mediansFile from "@/data/VIC/medians.json";

import {
  computeAffordabilityForLocality,
  localityWithinKmOfStations,
} from "@/lib/mapAfford";

type DwellingType = "house" | "unit";

function normName(s: string) {
  return (s || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .trim();
}

export default function MapPage() {
  const [dwellingType, setDwellingType] = useState<DwellingType>("house");
  const [stationKm, setStationKm] = useState<number>(5);

  const [prefBeds, setPrefBeds] = useState(2);
  const [prefBaths, setPrefBaths] = useState(1);
  const [prefCars, setPrefCars] = useState(1);
  const [prefLand, setPrefLand] = useState(0);

  const [boundaries, setBoundaries] = useState<any>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // ✅ fetch big geojson from /public (no bundling)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadErr(null);
        const res = await fetch("/data/VIC/boundaries.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setBoundaries(json);
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message ?? "Failed to load boundaries");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const geo = useMemo(() => {
    if (!boundaries) return null;

    const mediansRaw = (mediansFile as any).medians;
    const medians = new globalThis.Map();
    for (const [k, v] of Object.entries(mediansRaw)) {
      medians.set(normName(String(k)), v);
    }

    const st = stations as any;

    return {
      ...boundaries,
      features: (boundaries.features || []).map((f: any) => {
        const rawName =
          f.properties?.vic_loca_2 ??
          f.properties?.LOCALITY ??
          f.properties?.locality ??
          f.properties?.name ??
          f.properties?.Locality ??
          "";

        const name = normName(rawName);

        const okStation = localityWithinKmOfStations(f, st, stationKm);

        const medianEntry = medians.get(name) as
          | { house: number; unit: number | null }
          | undefined;

        const r = computeAffordabilityForLocality(
          rawName,
          medianEntry,
          dwellingType
        );

        const finalColor = okStation ? r.color : "gray";

        return {
          ...f,
          properties: {
            ...f.properties,
            _name: rawName,
            _color: finalColor,
            _reason: okStation
              ? r.reason
              : `Filtered out (not within ${stationKm}km of a station)`,
            _price: (r as any).price ?? null,
          },
        };
      }),
    };
  }, [boundaries, dwellingType, stationKm]);

  const fillLayer: any = {
    id: "localities-fill",
    type: "fill",
    paint: {
      "fill-opacity": 0.55,
      "fill-color": [
        "match",
        ["get", "_color"],
        "green",
        "#22c55e",
        "amber",
        "#f59e0b",
        "orange",
        "#fb923c",
        "red",
        "#ef4444",
        "gray",
        "#94a3b8",
        "#94a3b8",
      ],
    },
  };

  const outlineLayer: any = {
    id: "localities-outline",
    type: "line",
    paint: {
      "line-color": "rgba(255,255,255,0.20)",
      "line-width": 1,
    },
  };

  const stationLayer: any = {
    id: "stations-points",
    type: "circle",
    paint: {
      "circle-radius": 4,
      "circle-color": "rgba(34,211,238,0.9)",
      "circle-stroke-color": "rgba(255,255,255,0.25)",
      "circle-stroke-width": 1,
    },
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Housing Affordability Map (VIC)
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Real VIC locality boundaries loaded from /public to avoid bundling
            issues.
          </p>
        </div>

        {loadErr && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            Failed to load boundaries: <span className="font-semibold">{loadErr}</span>
            <div className="mt-2 text-white/60">
              Make sure the file exists at <code>public/data/VIC/boundaries.json</code>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
            <div className="text-sm font-semibold">Filters</div>

            <div className="flex gap-2">
              <button
                className={`rounded-xl px-3 py-2 text-sm border ${
                  dwellingType === "house"
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
                onClick={() => setDwellingType("house")}
              >
                House
              </button>
              <button
                className={`rounded-xl px-3 py-2 text-sm border ${
                  dwellingType === "unit"
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
                onClick={() => setDwellingType("unit")}
              >
                Unit
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-sm text-white/70">Train station radius</div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  className="w-full"
                  type="range"
                  min={0}
                  max={15}
                  step={1}
                  value={stationKm}
                  onChange={(e) => setStationKm(Number(e.target.value))}
                />
                <div className="text-sm text-white/70 w-12 text-right">
                  {stationKm}km
                </div>
              </div>
              <div className="mt-1 text-xs text-white/45">
                Stations are still SAMPLE for now.
              </div>
            </div>

            <div className="text-sm font-semibold">Preferences (future filters)</div>
            <div className="grid grid-cols-2 gap-3">
              <PrefInput label="Beds" value={prefBeds} onChange={setPrefBeds} />
              <PrefInput label="Baths" value={prefBaths} onChange={setPrefBaths} />
              <PrefInput label="Car spaces" value={prefCars} onChange={setPrefCars} />
              <PrefInput label="Land (m²)" value={prefLand} onChange={setPrefLand} />
            </div>

            <LegendBlock />
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            <div className="h-[72vh] min-h-[520px]">
              <Map
                initialViewState={{
                  longitude: 144.9631,
                  latitude: -37.8136,
                  zoom: 6.6,
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              >
                {geo && (
                  <Source id="localities" type="geojson" data={geo as any}>
                    <Layer {...fillLayer} />
                    <Layer {...outlineLayer} />
                  </Source>
                )}

                <Source id="stations" type="geojson" data={stations as any}>
                  <Layer {...stationLayer} />
                </Source>
              </Map>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PrefInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs text-white/50">{label}</div>
      <input
        type="number"
        className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function LegendBlock() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-sm text-white/70 font-medium mb-2">Legend</div>
      <div className="space-y-2 text-xs text-white/60">
        <Row c="#22c55e" t="Affordable now" />
        <Row c="#f59e0b" t="Close" />
        <Row c="#fb923c" t="Stretch" />
        <Row c="#ef4444" t="Not affordable" />
        <Row c="#94a3b8" t="Filtered / missing" />
      </div>
    </div>
  );
}

function Row({ c, t }: { c: string; t: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ backgroundColor: c }}
      />
      <span>{t}</span>
    </div>
  );
}
