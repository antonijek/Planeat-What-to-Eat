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
