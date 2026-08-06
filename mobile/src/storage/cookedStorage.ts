import { CookedEntry } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "./storage";

const key = STORAGE_KEYS.cooked;

export async function getAllCooked(): Promise<CookedEntry[]> {
  return (await getItem<CookedEntry[]>(key)) ?? [];
}

export async function addCooked(recipeId: string, cookedAt: Date): Promise<void> {
  const all = await getAllCooked();
  all.push({ recipeId, cookedAt: cookedAt.toISOString() });
  // zadrži poslednjih 3000 unosa da ne raste previše
  await setItem(key, all.slice(-3000));
}

export async function removeCooked(recipeId: string): Promise<void> {
  const all = await getAllCooked();
  await setItem(key, all.filter((e) => e.recipeId !== recipeId));
}

export async function clearCooked(): Promise<void> {
  await setItem(key, []);
}
