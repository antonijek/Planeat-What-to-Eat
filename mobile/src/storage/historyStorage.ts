import { HistoryEntry } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "./storage";

const key = STORAGE_KEYS.history;

export async function getAllHistory(): Promise<HistoryEntry[]> {
  return (await getItem<HistoryEntry[]>(key)) ?? [];
}

export async function addHistoryEntry(recipeId: string, spunAt: Date): Promise<void> {
  const all = await getAllHistory();
  all.push({ recipeId, spunAt: spunAt.toISOString() });
  // ograniči da ne raste previše — zadrži poslednjih 2000 vrtnji
  await setItem(key, all.slice(-2000));
}

export async function clearHistory(): Promise<void> {
  await setItem(key, []);
}
