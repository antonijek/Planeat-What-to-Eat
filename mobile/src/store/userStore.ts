import { create } from "zustand";
import { Favorite, PremiumType } from "../types";
import {
  getItem,
  setItem,
  STORAGE_KEYS,
} from "../storage/storage";
import { premiumService } from "../services/premiumService";

interface UserState {
  premium: PremiumType;
  isPremium: boolean;
  favorites: Favorite[];
  ratings: Record<string, number>;
  calorieGoal: number;
  loadUserData: () => Promise<void>;
  setPremium: (type: PremiumType) => Promise<void>;
  setCalorieGoal: (kcal: number) => Promise<void>;
  toggleFavorite: (recipeId: string, pinned?: boolean) => Promise<void>;
  rate: (recipeId: string, score: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  premium: "free",
  isPremium: false,
  favorites: [],
  ratings: {},
  calorieGoal: 2000,

  async loadUserData() {
    const isPremium = await premiumService.isPremium();
    const st = await premiumService.getState();
    const favorites = (await getItem<Favorite[]>(STORAGE_KEYS.favorites)) ?? [];
    const ratings = (await getItem<Record<string, number>>(STORAGE_KEYS.ratings)) ?? {};
    const calorieGoal = (await getItem<number>(STORAGE_KEYS.calorieGoal)) ?? 2000;
    set({ isPremium, premium: st.type, favorites, ratings, calorieGoal });
  },

  async setPremium(type: PremiumType) {
    if (type === "monthly") {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      await premiumService.setMonthly(expires);
    } else if (type === "lifetime") {
      await premiumService.setLifetime();
    } else {
      await premiumService.setFree();
    }
    set({ premium: type, isPremium: type !== "free" });
  },

  async setCalorieGoal(kcal: number) {
    const goal = Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : 2000;
    await setItem(STORAGE_KEYS.calorieGoal, goal);
    set({ calorieGoal: goal });
  },

  async toggleFavorite(recipeId: string, pinned?: boolean) {
    const favorites = [...get().favorites];
    const idx = favorites.findIndex((f) => f.recipeId === recipeId);
    if (idx >= 0) {
      favorites.splice(idx, 1);
    } else {
      favorites.push({ recipeId, isPinned: pinned ?? false, addedAt: new Date().toISOString() });
    }
    await setItem(STORAGE_KEYS.favorites, favorites);
    set({ favorites });
  },

  async rate(recipeId: string, score: number) {
    const ratings = { ...get().ratings, [recipeId]: score };
    await setItem(STORAGE_KEYS.ratings, ratings);
    set({ ratings });
  },
}));
