// scripts/build_vic_medians.mjs
import fs from "node:fs";
import * as XLSXNS from "xlsx";

// Handle ESM import differences
const XLSX = XLSXNS.default ?? XLSXNS;

const inPath = "src/data/VIC/raw/vic_houses_by_suburb.xlsx";
const outPath = "src/data/VIC/medians.json";

if (!fs.existsSync(inPath)) {
  console.error(`Missing input file: ${inPath}`);
  process.exit(1);
}

const wb = XLSX.readFile(inPath);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];

// Convert to rows
const rows = XLSX.utils.sheet_to_json(ws, {
  header: 1,
  raw: true,
  defval: "",
});

if (!rows.length) {
  console.error("XLSX appears empty.");
  process.exit(1);
}

// ---------- FIND HEADER ROW ----------
function findHeaderRowIndex() {
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const r = rows[i].map((x) => String(x ?? "").trim().toLowerCase());

    const hasLocality = r.some((c) => c.includes("locality"));
    const hasSuburb = r.some((c) => c.includes("suburb"));

    if (hasLocality || hasSuburb) return i;
  }
  return -1;
}

const headerRowIndex = findHeaderRowIndex();

if (headerRowIndex === -1) {
  console.error("Could not find header row.");
  console.error(rows.slice(0, 10));
  process.exit(1);
}

const header = rows[headerRowIndex].map((h) => String(h ?? "").trim());
const lcHeader = header.map((h) => h.toLowerCase());

// ---------- FIND LOCALITY / SUBURB COLUMN ----------
let suburbCol = lcHeader.findIndex(
  (h) => h === "locality" || h.includes("locality")
);

if (suburbCol === -1) {
  suburbCol = lcHeader.findIndex(
    (h) => h === "suburb" || h.includes("suburb")
  );
}

if (suburbCol === -1) {
  console.error("Found header row but no Locality/Suburb column.");
  console.error("Header:", header);
  process.exit(1);
}

// ---------- FIND YEAR COLUMNS ----------
const yearCols = header
  .map((h, i) => ({ h: String(h), i }))
  .filter(({ h }) => /^\d{4}$/.test(h))
  .sort((a, b) => Number(b.h) - Number(a.h));

if (!yearCols.length) {
  console.error("Could not find year columns.");
  console.error("Header:", header);
  process.exit(1);
}

const latestYear = yearCols[0].h;
const latestYearCol = yearCols[0].i;

// ---------- NUMBER CLEANER ----------
function toNumber(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^0-9.]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

// ---------- BUILD MEDIANS ----------
const medians = {};

for (let r = headerRowIndex + 1; r < rows.length; r++) {
  const row = rows[r];

  const suburb = String(row[suburbCol] ?? "").trim();
  if (!suburb) continue;

  const house = toNumber(row[latestYearCol]);
  if (!Number.isFinite(house) || house <= 0) continue;

  medians[suburb] = {
    house,
    unit: null, // units later
  };
}

// ---------- SAVE FILE ----------
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      _latestYear: latestYear,
      medians,
    },
    null,
    2
  )
);

console.log(
  `✅ Wrote ${Object.keys(medians).length} suburb medians (latest year ${latestYear}) to ${outPath}`
);
