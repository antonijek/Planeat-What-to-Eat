import { CalorieDayLog, CalorieEntry } from "../types";
import { getDay, getAllLogs, saveDay } from "../storage/calorieLogStorage";
import { calcForGrams, cookedPer100, calcForPer100 } from "./calorieCalculator";

export interface DailyTotals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  entries: CalorieEntry[];
  count: number;
}

function todayKey(): string {
  return dateKeyFor(new Date());
}

function dateKeyFor(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function dateKeyForToday(): string {
  return todayKey();
}

/** Vrati dateKey za pomeranje za N dana u odnosu na danas (negativno = ranije). */
export function dateKeyOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return dateKeyFor(d);
}

function uid(): string {
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const calorieLogService = {
  async getToday(): Promise<DailyTotals> {
    const day = await getDay(todayKey());
    return summarize(day);
  },

  async getTotalsForDay(dateKey: string): Promise<DailyTotals> {
    const day = await getDay(dateKey);
    return summarize(day);
  },

  /** Pronađi kcal na 100g (kuvano za dnevnik) — podudara se sa onim što će biti uneseno. */
  lookup(name: string): { found: boolean; per100Kcal: number } {
    const m = cookedPer100(name);
    return m ? { found: true, per100Kcal: m.kcal } : { found: false, per100Kcal: 0 };
  },

  /** Dodaj jednu namirnicu za dati dan (default danas). Ako je dat per100 (iz sugestije cooked/raw), koristi njega. */
  async addEntry(
    name: string,
    grams: number,
    dateKey?: string,
    per100?: { kcal: number; protein: number; fat: number; carbs: number; fiber?: number }
  ): Promise<DailyTotals> {
    const { matched } = per100
      ? calcForPer100(name, grams, per100)
      : calcForGrams(name, grams);
    if (!matched) {
      throw new Error("NOT_FOUND");
    }
    const key = dateKey ?? todayKey();
    const day = (await getDay(key)) ?? { dateKey: key, entries: [] };
    const entry: CalorieEntry = {
      id: uid(),
      name: name.trim(),
      grams: matched.grams,
      kcal: Math.round((matched.per100.kcal * matched.grams) / 100),
      protein: Math.round((matched.per100.protein * matched.grams) / 100),
      fat: Math.round((matched.per100.fat * matched.grams) / 100),
      carbs: Math.round((matched.per100.carbs * matched.grams) / 100),
      fiber: matched.per100.fiber
        ? Math.round((matched.per100.fiber * matched.grams) / 100)
        : 0,
      loggedAt: new Date().toISOString(),
    };
    day.entries.push(entry);
    await saveDay(day);
    return summarize(day);
  },

  /** Ručni unos kalorija (kada sastojak/jelo nisu u bazi). Makroi se ne znaju. */
  async addManualEntry(name: string, kcal: number, dateKey?: string): Promise<DailyTotals> {
    const k = Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : 0;
    if (!name.trim() || k <= 0) return summarize(null);
    const key = dateKey ?? todayKey();
    const day = (await getDay(key)) ?? { dateKey: key, entries: [] };
    const entry: CalorieEntry = {
      id: uid(),
      name: name.trim(),
      grams: 0,
      kcal: k,
      protein: 0,
      fat: 0,
      carbs: 0,
      loggedAt: new Date().toISOString(),
    };
    day.entries.push(entry);
    await saveDay(day);
    return summarize(day);
  },

  /** Dodaj recept u dnevnik kao obrok (kcal + makroi za ukupnu količinu / porcije). */
  async addCookedMeal(
    name: string,
    kcal: number,
    opts?: { protein?: number; carbs?: number; fats?: number; dateKey?: string }
  ): Promise<DailyTotals> {
    const k = Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : 0;
    if (!name.trim() || k <= 0) return summarize(null);
    const key = opts?.dateKey ?? todayKey();
    const day = (await getDay(key)) ?? { dateKey: key, entries: [] };
    const entry: CalorieEntry = {
      id: uid(),
      name: name.trim(),
      grams: 0,
      kcal: k,
      protein: opts?.protein ?? 0,
      fat: opts?.fats ?? 0,
      carbs: opts?.carbs ?? 0,
      loggedAt: new Date().toISOString(),
    };
    day.entries.push(entry);
    await saveDay(day);
    return summarize(day);
  },

  async removeEntry(id: string, dateKey?: string): Promise<DailyTotals> {
    const key = dateKey ?? todayKey();
    const day = await getDay(key);
    if (!day) return summarize(null);
    day.entries = day.entries.filter((e) => e.id !== id);
    await saveDay(day);
    return summarize(day);
  },

  async clearToday(dateKey?: string): Promise<DailyTotals> {
    const key = dateKey ?? todayKey();
    const day = (await getDay(key)) ?? { dateKey: key, entries: [] };
    day.entries = [];
    await saveDay(day);
    return summarize(day);
  },

  async getAllDays(): Promise<CalorieDayLog[]> {
    return getAllLogs();
  },
};

function summarize(day: CalorieDayLog | null): DailyTotals {
  if (!day) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, entries: [], count: 0 };
  }
  let kcal = 0, protein = 0, fat = 0, carbs = 0, fiber = 0;
  for (const e of day.entries) {
    kcal += e.kcal;
    protein += e.protein;
    fat += e.fat;
    carbs += e.carbs;
    fiber += e.fiber ?? 0;
  }
  return { kcal, protein, fat, carbs, fiber, entries: day.entries, count: day.entries.length };
}
