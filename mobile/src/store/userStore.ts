import { create } from "zustand";
import { Favorite, PremiumType } from "../types";
import { premiumService } from "../services/premiumService";
import { favoritesService } from "../services/favoritesService";
import { settingsService } from "../services/settingsService";

interface UserState {
  premium: PremiumType;
  isPremium: boolean;
  /** Da li je probni period trenutno aktivan. */
  trialActive: boolean;
  /** Preostalo dana probnog perioda (samo kada je aktivan). */
  trialDaysLeft: number;
  favorites: Favorite[];
  ratings: Record<string, number>;
  calorieGoal: number;
  loadUserData: () => Promise<void>;
  setPremium: (type: PremiumType) => Promise<void>;
  setCalorieGoal: (kcal: number) => Promise<void>;
  toggleFavorite: (recipeId: string, pinned?: boolean) => Promise<void>;
  /** Pin/unpin recept u omiljenima (max 5 pinned). Ne briše iz omiljenih. */
  pinFavorite: (recipeId: string) => Promise<boolean>;
  rate: (recipeId: string, score: number) => Promise<void>;
  /** Startuje probni period (ako još nije korišćen) i osvežava stanje. */
  startTrial: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  premium: "free",
  isPremium: false,
  trialActive: false,
  trialDaysLeft: 0,
  favorites: [],
  ratings: {},
  calorieGoal: 2000,

  async loadUserData() {
    const isPremium = await premiumService.isPremium();
    const st = await premiumService.getState();
    const favorites = await favoritesService.getFavorites();
    const ratings = await favoritesService.getRatings();
    const calorieGoal = await settingsService.getCalorieGoal();
    const trialActive = !isPremium && (await premiumService.isTrialActive());
    const trialDaysLeft = trialActive ? await premiumService.getTrialDaysLeft() : 0;
    set({ isPremium, premium: st.type, favorites, ratings, calorieGoal, trialActive, trialDaysLeft });
  },

  async startTrial() {
    await premiumService.startTrialIfNeeded();
    const isPremium = await premiumService.isPremium();
    const trialActive = !isPremium && (await premiumService.isTrialActive());
    const trialDaysLeft = trialActive ? await premiumService.getTrialDaysLeft() : 0;
    set({ isPremium, trialActive, trialDaysLeft });
  },

  async setPremium(type: PremiumType) {
    if (type === "monthly") {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      await premiumService.setMonthly(expires);
    } else if (type === "yearly") {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await premiumService.setYearly(expires);
    } else if (type === "lifetime") {
      await premiumService.setLifetime();
    } else {
      await premiumService.setFree();
    }
    const isPremium = type !== "free";
    set({ premium: type, isPremium, trialActive: false, trialDaysLeft: 0 });
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

  async pinFavorite(recipeId: string) {
    const favorites = [...get().favorites];
    const idx = favorites.findIndex((f) => f.recipeId === recipeId);
    if (idx < 0) {
      // nije u omiljenima — dodaj direktno kao pinned
      const pinned = { recipeId, isPinned: true, addedAt: new Date().toISOString() };
      favorites.push(pinned);
      await favoritesService.saveFavorites(favorites);
      set({ favorites });
      return true;
    }
    const isPinned = !favorites[idx].isPinned;
    // max 5 pinned: ne dozvoli preko limita
    if (isPinned) {
      const pinnedCount = favorites.filter((f) => f.isPinned).length;
      if (pinnedCount >= 5) {
        return false;
      }
    }
    favorites[idx] = { ...favorites[idx], isPinned };
    await favoritesService.saveFavorites(favorites);
    set({ favorites });
    return true;
  },

  async rate(recipeId: string, score: number) {
    const ratings = { ...get().ratings, [recipeId]: score };
    await favoritesService.saveRatings(ratings);
    set({ ratings });
  },
}));
