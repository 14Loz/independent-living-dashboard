// src/lib/homeStore.ts
import { DEFAULT_HOME, type HomeInputs } from "./homeCalc";

const KEY = "il_vic_home_v1";

export function loadHome(): HomeInputs {
  if (typeof window === "undefined") return DEFAULT_HOME;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_HOME;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_HOME, ...parsed };
  } catch {
    return DEFAULT_HOME;
  }
}

export function saveHome(h: HomeInputs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(h));
}
