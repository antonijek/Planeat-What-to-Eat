import i18n from "../i18n";
import { translationContentFor } from "./translationContent";
import { UNIT_LABELS } from "../i18n/baza/units";
import { DISH_LABELS } from "../i18n/baza/dishes";
import { ContentLang } from "../i18n/baza/categories";

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

// === Jela (dish_map) — prevodi naziva jela za sve jezike ===

/** Reverzna mapa: preveden naziv jela -> engleski ključ dish_map (per jezik). */
const dishRevCache: Record<string, Record<string, string>> = {};

function dishReverseMap(lang: string): Record<string, string> {
  if (dishRevCache[lang]) return dishRevCache[lang];
  const rev: Record<string, string> = {};
  for (const en of Object.keys(DISH_LABELS)) {
    const tr = DISH_LABELS[en]?.[lang as ContentLang];
    if (tr && tr.trim().toLowerCase() !== en) {
      rev[tr.trim().toLowerCase()] = en;
    }
  }
  dishRevCache[lang] = rev;
  return rev;
}

/** Prevedi unos naziva jela na engleski ključ dish_map (ili vrati unos ako nema prevoda). */
export function toEnglishDish(input: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  const key = input.trim().toLowerCase();
  if (!key || l === "en") return key;
  const rev = dishReverseMap(l);
  return rev[key] || key;
}

/** Prevedi engleski ključ jela na trenutni jezik za prikaz predloga. */
export function localizedDish(englishKey: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  if (l === "en") return englishKey;
  const tr = DISH_LABELS[englishKey.trim().toLowerCase()]?.[l as ContentLang];
  return (tr && tr.trim()) ? tr : englishKey;
}

/** Vrati engleske ključeve jela čiji prevod na trenutnom jeziku SADRŽI dati unos. */
export function englishDishKeysByLocalizedPartial(input: string, lang?: string): string[] {
  const l = (lang || currentLang()).toLowerCase();
  const q = input.trim().toLowerCase();
  if (!q || l === "en") return [];
  const out: string[] = [];
  for (const enKey of Object.keys(DISH_LABELS)) {
    const tr = DISH_LABELS[enKey]?.[l as ContentLang];
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
 * Konvertuje imperijalne jedinice u metričke (pre prevoda).
 * "1 oz" → "28.35 g", "2 lb" → "907 g", "1 fl oz" → "30 ml", "1/4 inch" → "0.6 cm".
 * Vraća null ako jedinica nije prepoznata (tada ide dalje na reč-po-reč prevod).
 */
const IMPERIAL_TO_METRIC: Array<{
  re: RegExp;
  factor: number;
  unit: string;
}> = [
  { re: /(fl\s*oz)/i, factor: 30, unit: "ml" }, // 1 fl oz ≈ 30 ml
  { re: /(pints?|pt\b)/i, factor: 473, unit: "ml" },
  { re: /(quarts?|qt\b)/i, factor: 946, unit: "ml" },
  { re: /(gallons?)/i, factor: 3785, unit: "ml" },
  { re: /(ounces?|oz\b)/i, factor: 28.35, unit: "g" },
  { re: /(pounds?|lbs?)/i, factor: 453.6, unit: "g" },
  { re: /(inches?|in\b)/i, factor: 2.54, unit: "cm" },
  { re: /(tablespoons?|tbsp)/i, factor: 15, unit: "ml" },
  { re: /(teaspoons?|tsp)/i, factor: 5, unit: "ml" },
];

function convertImperial(measure: string): string | null {
  const m = measure.trim().match(/^([\d./]+)\s*([a-zA-Z]+)/);
  if (!m) return null;
  const num = parseFraction(m[1]);
  if (num === null) return null;
  const word = m[2].toLowerCase();
  const rule = IMPERIAL_TO_METRIC.find((r) => r.re.test(word));
  if (!rule) return null;
  const rest = measure.trim().slice(m[0].length).trim();
  const val = num * rule.factor;
  const rounded = Number.isInteger(val) ? String(val) : val.toFixed(1);
  const out = `${rounded} ${rule.unit}`;
  return rest ? `${out} ${rest}` : out;
}

/** Parsira broj ili razlomak ("1", "1/2", "1 1/2", "0.25") → broj ili null. */
function parseFraction(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const parts = t.split(/\s+/);
  let total = 0;
  for (const p of parts) {
    if (p.includes("/")) {
      const [a, b] = p.split("/");
      const n = parseFloat(a);
      const d = parseFloat(b);
      if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
      total += n / d;
    } else {
      const n = parseFloat(p);
      if (!Number.isFinite(n)) return null;
      total += n;
    }
  }
  return total;
}

/**
 * Prevede celu meru ("2 cups" -> "2 šolje", "1 tbsp chopped" -> "1 kašika seckano").
 * Prvo konvertuje imperijalne u metričke (svim jezicima), pa prevodi preostale reči.
 * Čista mera koja je samo broj ("1") dobija "kom" na trenutnom jeziku.
 */
export function translateMeasure(measure: string, lang?: string): string {
  const l = (lang || currentLang()).toLowerCase();
  if (!measure) return measure;
  const converted = l === "en" ? null : convertImperial(measure);
  const source = converted ?? measure;
  // "1" → "1 kom" (sastojak bez jedinice u bazi, npr. "Lime", "1")
  if (/^[\d./]+\s*$/.test(source.trim())) {
    const pcs = UNIT_LABELS["kom"]?.[l as keyof typeof UNIT_LABELS["kom"]] || "kom";
    return `${source.trim()} ${pcs}`;
  }
  if (l === "en") return source;
  return source
    .split(/(\s+)/)
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      return translateUnit(tok, l);
    })
    .join("");
}


