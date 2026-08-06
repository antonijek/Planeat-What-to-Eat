export type Difficulty = "lako" | "srednje" | "teško";
export type PremiumType = "free" | "monthly" | "lifetime";

export interface Ingredient {
  name: string;
  measure: string;
  amount: number;
  unit: string;
  /** Približna gramaža (iz USDA / procene) — dodaje skripta enrich_nutrition. */
  grams?: number | null;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  prepTime: number;
  difficulty: Difficulty;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  /** Dodatni makronutrijenti iz USDA (opciono). */
  fiber?: number;
  sugars?: number;
  addedSugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  /** Procenjen broj porcija (iz ukupnih kalorija) — dodaje skripta. */
  servings?: number;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl: string;
  source: string;
  dietaryTags: string[];
}

export interface RecipeOverride {
  recipeId: string;
  name?: string;
  category?: string;
  instructions?: string[];
  ingredients?: Ingredient[];
  prepTime?: number;
  updatedAt: string;
}

export interface Favorite {
  recipeId: string;
  isPinned: boolean;
  addedAt: string;
}

export interface HistoryEntry {
  recipeId: string;
  spunAt: string;
}

/** "Šta sam skuvao" — datum kad je korisnik stvarno spremio jelo. */
export interface CookedEntry {
  recipeId: string;
  cookedAt: string;
}

/** Jedna uneta namirnica/jelo u kalorijskom dnevniku. */
export interface CalorieEntry {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  loggedAt: string;
}

/** Stanje za jedan dan: lista stavki + ukupne vrednosti (cache). */
export interface CalorieDayLog {
  dateKey: string; // "yyyy-mm-dd"
  entries: CalorieEntry[];
}

export interface MealPlanEntry {
  id: string;
  dayOfWeek: number; // 0=Pon ... 6=Ned
  mealType: "ručak" | "večera";
  recipeId: string;
  persons: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  isManual: boolean;
  isChecked: boolean;
  sourceRecipeIds: string[];
}

export interface Rating {
  recipeId: string;
  score: number;
}

export interface UserSettings {
  defaultPersons: number;
  darkMode: boolean;
  language: string;
}
