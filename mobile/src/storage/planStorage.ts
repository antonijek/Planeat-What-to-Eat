import { MealPlanEntry } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "./storage";

const key = STORAGE_KEYS.mealPlan;

export async function getPlan(): Promise<MealPlanEntry[]> {
  return (await getItem<MealPlanEntry[]>(key)) ?? [];
}

export async function setPlan(plan: MealPlanEntry[]): Promise<void> {
  await setItem(key, plan);
}
