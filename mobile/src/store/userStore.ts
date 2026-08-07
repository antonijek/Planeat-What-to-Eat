import { create } from "zustand";
import { Favorite, PremiumType } from "../types";
import { premiumService } from "../services/premiumService";
import { favoritesService } from "../services/favoritesService";
import { settingsService } from "../services/settingsService";

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
    const favorites = await favoritesService.getFavorites();
    const ratings = await favoritesService.getRatings();
    const calorieGoal = await settingsService.getCalorieGoal();
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
    await settingsService.saveCalorieGoal(goal);
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
    await favoritesService.saveFavorites(favorites);
    set({ favorites });
  },

  async rate(recipeId: string, score: number) {
    const ratings = { ...get().ratings, [recipeId]: score };
    await favoritesService.saveRatings(ratings);
    set({ ratings });
  },
}));
