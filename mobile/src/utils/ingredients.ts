import { Ingredient } from "../types";

/**
 * Zajedničke funkcije za rad sa sastojcima u formama.
 * Formati se koriste u AddRecipeModal i EditRecipeModal.
 *
 * Forma u tekstualnom polju (svaki red):
 *   "naziv | količina | jedinica"
 */

export function ingredientsToText(ingredients: Ingredient[]): string {
  return ingredients.map((i) => `${i.name} | ${i.amount} | ${i.unit}`).join("\n");
}

export function textToIngredients(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return {
        name: parts[0] ?? "Sastojak",
        amount: parseFloat(parts[1]) || 1,
        unit: parts[2] || "kom",
        measure: "",
      };
    });
}

export function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parsira korisnički unos sastojaka (npr. "chicken,potatoes; rice") u niz
 * čistih, malim slovima napisanih imena. Uklanja nevidljive/zamrače karaktere.
 */
export function parseIngredientInput(text: string): string[] {
  const clean = (s: string) =>
    s
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u034F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const parts = text.split(/[,;]/).map(clean).filter(Boolean);
  return Array.from(new Set(parts));
}
