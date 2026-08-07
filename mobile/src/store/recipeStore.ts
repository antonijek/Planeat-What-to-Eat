import { create } from "zustand";
import { Recipe } from "../types";
import { recipeService } from "../services/recipeService";
import { overrideService } from "../services/overrideService";

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  lastSpunRecipeId: string | null;
  spinCount: number;
  spinRemaining: number | null;
  load: () => Promise<void>;
  spin: () => Promise<Recipe>;
  getById: (id: string) => Promise<Recipe>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  lastSpunRecipeId: null,
  spinCount: 0,
  spinRemaining: null,

  async load() {
    const recipes = await recipeService.getAllIncludingUser();
    set({ recipes, loading: false });
  },

  async spin() {
    const { recipes } = get();
    if (recipes.length === 0) throw new Error("No recipes");
    const rand = recipes[Math.floor(Math.random() * recipes.length)];
    set((s) => ({
      lastSpunRecipeId: rand.id,
      spinCount: s.spinCount + 1,
    }));
    return rand;
  },

  async getById(id) {
    if (id.startsWith("user-")) {
      const mine = await recipeService.getByIdAny(id);
      if (!mine) throw new Error("Custom recipe not found");
      return mine;
    }
    return overrideService.getEffective(id);
  },
}));
