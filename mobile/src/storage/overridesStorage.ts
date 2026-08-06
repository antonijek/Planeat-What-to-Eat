import { RecipeOverride } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "./storage";

/**
 * Cuva korisničke izmene recepata (overrides).
 * Originalni recept se NIKADA ne menja — izmene žive odvojeno,
 * a "vrati na original" = obriši override.
 */
const listKey = STORAGE_KEYS.overrides;

export async function getAllOverrides(): Promise<RecipeOverride[]> {
  return (await getItem<RecipeOverride[]>(listKey)) ?? [];
}

export async function getOverride(recipeId: string): Promise<RecipeOverride | null> {
  const all = await getAllOverrides();
  return all.find((o) => o.recipeId === recipeId) ?? null;
}

export async function saveOverride(override: RecipeOverride): Promise<void> {
  const all = await getAllOverrides();
  const idx = all.findIndex((o) => o.recipeId === override.recipeId);
  if (idx >= 0) all[idx] = override;
  else all.push(override);
  await setItem(listKey, all);
}

export async function clearOverride(recipeId: string): Promise<void> {
  const all = await getAllOverrides();
  await setItem(listKey, all.filter((o) => o.recipeId !== recipeId));
}
