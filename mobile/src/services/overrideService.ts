import { Difficulty, Ingredient, Recipe, RecipeOverride } from "../types";
import {
  clearOverride,
  getAllOverrides,
  saveOverride,
} from "../storage/overridesStorage";
import { recipeService } from "./recipeService";

/**
 * Spaja originalni recept sa korisničkim izmenama (override).
 * "Vrati na original" = clearOverride.
 */
export const overrideService = {
  async getOverride(recipeId: string): Promise<RecipeOverride | null> {
    return (await getAllOverrides()).find((o) => o.recipeId === recipeId) ?? null;
  },

  /** Vraća finalni recept (original + izmene). */
  async getEffective(recipeId: string): Promise<Recipe> {
    const base = recipeService.getById(recipeId);
    if (!base) throw new Error(`Recept ne postoji: ${recipeId}`);
    const override = await this.getOverride(recipeId);
    if (!override) return base;
    return {
      ...base,
      name: override.name ?? base.name,
      category: override.category ?? base.category,
      prepTime: override.prepTime ?? base.prepTime,
      ingredients: override.ingredients ?? base.ingredients,
      instructions: override.instructions ?? base.instructions,
      imageUrl: override.imageUrl ?? base.imageUrl,
      calories: override.calories ?? base.calories,
      protein: override.protein ?? base.protein,
      carbs: override.carbs ?? base.carbs,
      fats: override.fats ?? base.fats,
      difficulty: override.difficulty ?? base.difficulty,
      servings: override.servings ?? base.servings,
    };
  },

  async update(
    recipeId: string,
    changes: {
      name?: string;
      category?: string;
      instructions?: string[];
      ingredients?: Ingredient[];
      prepTime?: number;
      imageUrl?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fats?: number;
      difficulty?: Difficulty;
      servings?: number;
    }
  ): Promise<void> {
    const existing = await this.getOverride(recipeId);
    await saveOverride({
      recipeId,
      name: changes.name ?? existing?.name,
      category: changes.category ?? existing?.category,
      instructions: changes.instructions ?? existing?.instructions,
      ingredients: changes.ingredients ?? existing?.ingredients,
      prepTime: changes.prepTime ?? existing?.prepTime,
      imageUrl: changes.imageUrl ?? existing?.imageUrl,
      calories: changes.calories ?? existing?.calories,
      protein: changes.protein ?? existing?.protein,
      carbs: changes.carbs ?? existing?.carbs,
      fats: changes.fats ?? existing?.fats,
      difficulty: changes.difficulty ?? existing?.difficulty,
      servings: changes.servings ?? existing?.servings,
      updatedAt: new Date().toISOString(),
    });
  },

  async reset(recipeId: string): Promise<void> {
    await clearOverride(recipeId);
  },

  async isModified(recipeId: string): Promise<boolean> {
    return (await this.getOverride(recipeId)) != null;
  },
};
