import i18n from "../i18n";
import { translationContentFor } from "./translationContent";
import { UNIT_LABELS } from "../i18n/baza/units";

// Reverzna mapa: prevedeni sastojak -> engleski kanonski naziv (ključ u bazi).
// Gradi se iz generisanih prevoda i kešira po jeziku.
const reverseCache: Record<string, Record<string, string>> = {};

function reverseMap(lang: string): Record<string, string> {
  if (reverseCache[lang]) return reverseCache[lang];
  const rev: Record<string, string> = {};
  const content = translationContentFor(lang as never);
  const ing = content.ingredients || {};
  for (const en of Object.keys(ing)) {
    const tr = ing[en];
    if (tr && tr.trim() && tr.trim().toLowerCase() !== en) {
      rev[tr.trim().toLowerCase()] = en;
    }
  }
  reverseCache[lang] = rev;
  return rev;
}

/** Trenutni jezik aplikacije (2-slovni kod, fallback "en"). */
export function currentLang(): string {
  return (i18n.language || "en").slice(0, 2);
}

/**
 * Normalizuje korisnički unos sastojka na engleski kanonski naziv (ključ baze),
 * koristeći reverznu mapu trenutnog jezika. Ako prevod ne postoji, vraća unos
 * nepromenjen (pretraga će raditi na engleskom kao i ranije).
 */
export function toEnglishIngredient(input: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  const key = input.trim().toLowerCase();
  if (!key || l === "en") return key;
  const rev = reverseMap(l);
  return rev[key] || key;
}

/** Vrati listu svih mogućih engleskih naziva za dati unos (za podstring pretragu). */
export function englishAliases(input: string, lang?: string): string[] {
  const l = (lang || currentLang()).toLowerCase();
  const key = input.trim().toLowerCase();
  if (!key || l === "en") return [key];
  const rev = reverseMap(l);
  const out = [key];
  if (rev[key]) out.push(rev[key]);
  return Array.from(new Set(out));
}

/**
 * Prevedi engleski ključ sastojka nazad na trenutni jezik za prikaz predloga.
 * Fallback na engleski ako prevod ne postoji.
 */
export function localizedIngredient(englishKey: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  if (l === "en") return englishKey;
  const content = translationContentFor(l as never);
  const tr = content.ingredients?.[englishKey.trim().toLowerCase()];
  return (tr && tr.trim()) ? tr : englishKey;
}

/**
 * Vrati engleske ključeve sastojaka čiji prevod na trenutnom jeziku SADRŽI dati unos
 * (za delimične sugestije). Npr. unos "mle" na srpskom -> "milk" (mleko), "mleveno meso"...
 */
export function englishKeysByLocalizedPartial(input: string, lang?: string): string[] {
  const l = (lang || currentLang()).toLowerCase();
  const q = input.trim().toLowerCase();
  if (!q || l === "en") return [];
  const content = translationContentFor(l as never);
  const ing = content.ingredients || {};
  const out: string[] = [];
  for (const enKey of Object.keys(ing)) {
    const tr = ing[enKey];
    if (tr && tr.trim().toLowerCase().includes(q)) out.push(enKey);
  }
  return out;
}

/**
 * Prevede pojedinačnu jedinicu/deskriptor na trenutni jezik. Fallback na engleski.
 */
export function translateUnit(word: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  if (l === "en") return word;
  const key = word.trim().toLowerCase();
  return UNIT_LABELS[key]?.[l as keyof typeof UNIT_LABELS[keyof typeof UNIT_LABELS]] || word;
}

/**
 * Prevede celu meru ("2 cups" -> "2 šolje", "1 tbsp chopped" -> "1 kašika seckano").
 * Prevodi jedinice i deskriptore po rečima; brojevi i nepoznate reči ostaju.
 */
export function translateMeasure(measure: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  if (l === "en" || !measure) return measure;
  return measure
    .split(/(\s+)/)
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      return translateUnit(tok, l);
    })
    .join("");
}


