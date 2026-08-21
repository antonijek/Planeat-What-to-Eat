import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Centralizovani ključevi za AsyncStorage.
 * Ovo je granica ka "lokalnom izvoru istine" — kasnije, kad dođe backend,
 * ovi podaci se umesto AsyncStorage-a čitaju/pisuju preko API-ja.
 */
export const STORAGE_KEYS = {
  premium: "mm_premium",
  trialEnd: "mm_trial_end",
  favorites: "mm_favorites",
  history: "mm_history",
  cooked: "mm_cooked",
  calorieLog: "mm_calorie_log",
  overrides: "mm_overrides",
  mealPlan: "mm_meal_plan",
  shopping: "mm_shopping",
  ratings: "mm_ratings",
  settings: "mm_settings",
  myRecipes: "mm_my_recipes",
  user: "mm_user",
  calorieGoal: "mm_calorie_goal",
  language: "mm_language",
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // tiho ignoriši greške čuvanja
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // tiho ignoriši
  }
}
