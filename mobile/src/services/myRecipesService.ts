import { Recipe } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

function uid() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Sopstveni recepti korisnika.
 * SADA: lokalno u AsyncStorage.
 * KASNIJE (backend): POST/PUT/DELETE na /recipes preko API-ja.
 */
export const myRecipesService = {
  async getAll(): Promise<Recipe[]> {
    return (await getItem<Recipe[]>(STORAGE_KEYS.myRecipes)) ?? [];
  },

  async getById(id: string): Promise<Recipe | null> {
    const all = await this.getAll();
    return all.find((r) => r.id === id) ?? null;
  },

  async create(data: Omit<Recipe, "id">): Promise<Recipe> {
    const all = await this.getAll();
    const recipe: Recipe = { ...data, id: uid() };
    await setItem(STORAGE_KEYS.myRecipes, [...all, recipe]);
    return recipe;
  },

  async update(id: string, data: Partial<Recipe>): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], ...data };
    await setItem(STORAGE_KEYS.myRecipes, all);
  },

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    await setItem(STORAGE_KEYS.myRecipes, all.filter((r) => r.id !== id));
  },
};
