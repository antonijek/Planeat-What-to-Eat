import { HistoryEntry, CookedEntry } from "../types";
import {
  addHistoryEntry,
  getAllHistory,
  clearHistory,
} from "../storage/historyStorage";
import {
  getAllCooked,
  addCooked,
  removeCooked,
  clearCooked,
} from "../storage/cookedStorage";
import { recipeService } from "./recipeService";

export interface HistoryItem {
  recipeId: string;
  name: string;
  imageUrl: string;
  lastSpun: string;
  count: number;
}

export interface CookedDay {
  day: string; // "2026-08-04" ili "Today"/"Yesterday"
  dateKey: string;
  items: { recipeId: string; name: string; imageUrl: string; time: string }[];
}

export const historyService = {
  async getAll(): Promise<HistoryEntry[]> {
    return getAllHistory();
  },

  async record(recipeId: string): Promise<void> {
    await addHistoryEntry(recipeId, new Date());
  },

  async clear(): Promise<void> {
    await clearHistory();
  },

  /** Grupisano po receptu: koliko puta + poslednji put. Svi recepti, sa brojačima. */
  async getGrouped(): Promise<HistoryItem[]> {
    const entries = await getAllHistory();
    const map = new Map<string, { count: number; lastSpun: string }>();
    for (const e of entries) {
      const cur = map.get(e.recipeId) ?? { count: 0, lastSpun: e.spunAt };
      cur.count += 1;
      if (e.spunAt > cur.lastSpun) cur.lastSpun = e.spunAt;
      map.set(e.recipeId, cur);
    }
    return Array.from(map.entries())
      .map(([recipeId, { count, lastSpun }]) => {
        const r = recipeService.getById(recipeId);
        return {
          recipeId,
          name: r?.name ?? "Unknown recipe",
          imageUrl: r?.imageUrl ?? "",
          lastSpun,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  },

  async getTotalSpins(): Promise<number> {
    return (await getAllHistory()).length;
  },

  // === "Šta sam skuvao" (kuvani obroci) ===

  async getCooked(): Promise<CookedEntry[]> {
    return getAllCooked();
  },

  async recordCooked(recipeId: string): Promise<void> {
    await addCooked(recipeId, new Date());
  },

  async isCooked(recipeId: string): Promise<boolean> {
    const all = await getAllCooked();
    return all.some((e) => e.recipeId === recipeId);
  },

  async removeCooked(recipeId: string): Promise<void> {
    await removeCooked(recipeId);
  },

  async clearCooked(): Promise<void> {
    await clearCooked();
  },

  /** Grupisano po receptu (koliko puta skuvano + poslednji put), najcesce prvo. */
  async getCookedGroupedByRecipe(): Promise<HistoryItem[]> {
    const all = await getAllCooked();
    const map = new Map<string, { count: number; last: string }>();
    for (const e of all) {
      const cur = map.get(e.recipeId) ?? { count: 0, last: e.cookedAt };
      cur.count += 1;
      if (e.cookedAt > cur.last) cur.last = e.cookedAt;
      map.set(e.recipeId, cur);
    }
    return Array.from(map.entries())
      .map(([recipeId, { count, last }]) => {
        const r = recipeService.getById(recipeId);
        return {
          recipeId,
          name: r?.name ?? "Unknown recipe",
          imageUrl: r?.imageUrl ?? "",
          lastSpun: last,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  },

  /** Grupisano po danu (za prikaz "šta sam skuvao po danima"). */
  async getCookedGroupedByDay(): Promise<CookedDay[]> {
    const all = await getAllCooked();
    const dayMap = new Map<string, CookedDay>();
    const today = new Date();
    const toDate = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    };
    // sortiraj od najnovijeg
    all.sort((a, b) => (a.cookedAt < b.cookedAt ? 1 : -1));
    for (const e of all) {
      const d = new Date(e.cookedAt);
      const dateKey = toDate(e.cookedAt);
      const cur = dayMap.get(dateKey) ?? {
        day: dateKey,
        dateKey,
        items: [],
      };
      const r = recipeService.getById(e.recipeId);
      cur.items.push({
        recipeId: e.recipeId,
        name: r?.name ?? "Unknown recipe",
        imageUrl: r?.imageUrl ?? "",
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      dayMap.set(dateKey, cur);
    }
    return Array.from(dayMap.values());
  },
};
