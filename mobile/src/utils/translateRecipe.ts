import { Recipe } from "../types";
import { CATEGORY_LABELS, ContentLang } from "../i18n/baza/categories";
import { AREA_LABELS } from "../i18n/baza/areas";

// Generisani prevodi sastojaka i recepata (offline MT).
// Fallback na engleski ako ključ ne postoji.
import type { TranslationContent } from "./translationTypes";

type LangResolver = () => ContentLang;

/**
 * Prikazni prevod recepta: vraća KOPIJU s prevedenim prikaznim poljima
 * (name, category, area, ingredients[].name, instructions), a original
 * nikada ne menja. Pretraga i filteri nastavljaju da rade na engleskim
 * vrednostima originala.
 */
export function translateRecipe(
  recipe: Recipe,
  getLang: LangResolver,
  content: TranslationContent
): Recipe {
  const lang = getLang();
  if (!lang || lang === "en") return recipe;

  const catLabel = CATEGORY_LABELS[recipe.category]?.[lang];
  const areaLabel = AREA_LABELS[recipe.area]?.[lang];
  const recT = content.recipes?.[recipe.id];

  const ingredients = recipe.ingredients.map((ing) => {
    const key = ing.name.trim().toLowerCase();
    const translated = content.ingredients?.[key];
    return translated ? { ...ing, name: translated } : ing;
  });

  return {
    ...recipe,
    name: recT?.name || recipe.name,
    category: catLabel || recipe.category,
    area: areaLabel || recipe.area,
    ingredients,
    instructions: recT?.instructions || recipe.instructions,
  };
}
