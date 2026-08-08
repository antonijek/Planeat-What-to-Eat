import { useTranslation } from "react-i18next";
import { translationContentFor } from "./translationContent";
import { translateRecipe } from "./translateRecipe";
import { CATEGORY_LABELS, ContentLang } from "../i18n/baza/categories";
import { AREA_LABELS } from "../i18n/baza/areas";
import { Recipe } from "../types";

/**
 * Hook: prevodni sadržaj + funkcija za prikazni prevod recepta
 * na trenutni jezik. Vraća kopiju; original se ne menja.
 */
export function useTranslatedRecipe() {
  const { i18n } = useTranslation();
  const code = (i18n.language || "en").slice(0, 2);
  const lang = (["en", "de", "es", "fr", "it", "pt", "sr"].includes(code)
    ? code
    : "en") as ContentLang;
  const content = translationContentFor(lang);
  const translate = (recipe: Recipe): Recipe =>
    translateRecipe(recipe, () => lang, content);
  const category = (name: string): string =>
    CATEGORY_LABELS[name]?.[lang] || name;
  const area = (name: string): string => AREA_LABELS[name]?.[lang] || name;
  const ingredient = (name: string): string =>
    content.ingredients?.[name.trim().toLowerCase()] || name;
  const recipeName = (id: string, fallback: string): string =>
    content.recipes?.[id]?.name || fallback;
  return { translate, category, area, ingredient, recipeName, lang };
}
