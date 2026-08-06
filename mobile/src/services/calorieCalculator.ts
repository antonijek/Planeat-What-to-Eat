import { Ingredient } from "../types";
import ingredientMap from "../data/ingredient_map.json";
import dishMap from "../data/dish_map.json";

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type EntryType = "ingredient" | "dish";

export interface MatchResult {
  name: string;
  per100: Macros;
  type: EntryType;
}

export interface MatchedIngredient {
  name: string;
  /** kcal/masti itd. na 100 g iz mape */
  per100: Macros;
  grams: number;
  matchedName: string;
}

type MapEntry = { per100: Record<string, number | undefined> } | undefined;

const map: Record<string, MapEntry> = ingredientMap as Record<string, MapEntry>;
const dishEntries: Record<string, MapEntry> = dishMap as Record<string, MapEntry>;

function singular(w: string): string {
  if (/ies$/i.test(w)) return w.replace(/ies$/i, "y");
  if (/(s|oes)$/i.test(w)) return w.replace(/(s|oes)$/i, "");
  return w;
}

/** Srpski (i neki latinični) sinonimi → engleski ključ mape namirnica/jela. */
const SYNONYMS: Record<string, string> = {
  brasno: "flour",
  fluor: "flour",
  flupor: "flour",
  fluo: "flour",
  mleko: "milk",
  mlijeko: "milk",
  jaje: "egg",
  jaja: "eggs",
  secer: "sugar",
  so: "salt",
  sol: "salt",
  ulje: "oil",
  maslac: "butter",
  puter: "butter",
  pirinac: "rice",
  piletina: "chicken",
  krompir: "potatoes",
  krompiri: "potatoes",
  luk: "onion",
  paradajz: "tomatoes",
  krastavac: "cucumber",
  paprika: "pepper",
  kupus: "cabbage",
  sir: "cheese",
  kajmak: "cream",
  pasteta: "pate",
  tjestenina: "pasta",
  testenina: "pasta",
  makarone: "pasta",
  rezanci: "noodles",
  pecurke: "mushrooms",
  sljunka: "ham",
  slanina: "bacon",
  kobasica: "sausage",
  med: "honey",
  jogurt: "yogurt",
  kwasac: "yeast",
  palacinke: "pancakes",
};

function translateSynonym(rawName: string): string {
  const key = rawName.trim().toLowerCase();
  return SYNONYMS[key] ?? key;
}

/** Pronađi stavku (namirnicu ili jelo) najpreciznije moguće. */
export function matchIngredient(rawName: string): MatchResult | null {
  let n = translateSynonym(rawName);
  if (!n) return null;

  // 1) Jelo — SAMO egzaktno poklapanje (nema podstringa, da "pancakes" ne pogodi "rice flour pancakes")
  if (dishEntries[n]) {
    return { name: n, per100: toMacros(dishEntries[n]!.per100), type: "dish" };
  }
  const dishSing = singular(n);
  if (dishEntries[dishSing]) {
    return { name: dishSing, per100: toMacros(dishEntries[dishSing]!.per100), type: "dish" };
  }

  // 2) Namirnica — tačan poklapač
  if (map[n]) {
    const p = map[n]!.per100;
    return { name: n, per100: toMacros(p), type: "ingredient" };
  }

  // 3) Namirnica — singular vs plural
  const sing = singular(n);
  if (map[sing]) {
    return { name: sing, per100: toMacros(map[sing]!.per100), type: "ingredient" };
  }

  // 4) Namirnica — podstring (npr. "chicken breast fillet" → "chicken breast")
  //    Jelo NIKADA ne sme da se pogađa podstringom.
  let best: { key: string; per100: Macros } | null = null;
  for (const key of Object.keys(map)) {
    if (n.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, per100: toMacros(map[key]!.per100) };
    }
  }
  if (!best) {
    for (const key of Object.keys(map)) {
      if (key.includes(n) && (!best || key.length > best.key.length)) {
        best = { key, per100: toMacros(map[key]!.per100) };
      }
    }
  }
  return best ? { name: best.key, per100: best.per100, type: "ingredient" } : null;
}

function toMacros(p: Record<string, number | undefined>): Macros {
  return {
    kcal: p.kcal ?? 0,
    protein: p.protein ?? 0,
    fat: p.fat ?? 0,
    carbs: p.carbs ?? 0,
  };
}

/**
 * Namirnice koje drastično menjaju težinu i kalorije kuvanjem.
 * Koristi se SAMO u kalorijskom dnevniku (kad korisnik unese "šta je pojeo",
 * obično skuvano). Baza recepata se NE dira — ona i dalje računa sirovo.
 * Vrednosti su "kuvano" na 100 g.
 */
const COOKED_OVERRIDE: Record<string, Macros> = {
  rice: { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  "basmati rice": { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  "sushi rice": { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  pasta: { kcal: 158, protein: 5.8, fat: 0.9, carbs: 31 },
  spaghetti: { kcal: 158, protein: 5.8, fat: 0.9, carbs: 31 },
  noodles: { kcal: 145, protein: 4, fat: 1.7, carbs: 28 },
  "rice noodles": { kcal: 109, protein: 2, fat: 0.2, carbs: 24 },
  beans: { kcal: 120, protein: 8, fat: 0.4, carbs: 20 },
  "kidney beans": { kcal: 127, protein: 8.7, fat: 0.5, carbs: 22.8 },
  chickpeas: { kcal: 164, protein: 8.9, fat: 2.6, carbs: 27 },
  lentils: { kcal: 116, protein: 9, fat: 0.4, carbs: 20 },
  quinoa: { kcal: 120, protein: 4.4, fat: 1.9, carbs: 21 },
  oats: { kcal: 92, protein: 3.5, fat: 1.6, carbs: 16 },
  "rolled oats": { kcal: 71, protein: 2.5, fat: 1.5, carbs: 12 },
  barley: { kcal: 123, protein: 2.3, fat: 0.4, carbs: 28 },
  bulgur: { kcal: 83, protein: 3, fat: 0.2, carbs: 18 },
  couscous: { kcal: 112, protein: 3.8, fat: 0.2, carbs: 23 },
  potatoes: { kcal: 87, protein: 1.9, fat: 0.1, carbs: 20 },
  potato: { kcal: 87, protein: 1.9, fat: 0.1, carbs: 20 },
  "sweet potatoes": { kcal: 76, protein: 1.4, fat: 0.1, carbs: 18 },
  "sweet potato": { kcal: 76, protein: 1.4, fat: 0.1, carbs: 18 },
};

/** Za kalorijski dnevnik: vrati per100 makroe, uzevši u obzir kuvanu korekciju. */
export function cookedPer100(name: string): Macros | null {
  const base = matchIngredient(name);
  if (!base) return null;
  // jela su već otprilike kuvana — nemoj primeniti cooked override
  if (base.type === "dish") return base.per100;
  const cooked = COOKED_OVERRIDE[base.name] ?? COOKED_OVERRIDE[singular(base.name)] ?? null;
  return cooked ?? base.per100;
}

/** Pripremi entry koristeći zadani per100 (za sugestije s varijantom cooked/raw). */
export function calcForPer100(
  name: string,
  grams: number,
  per100: Macros
): { matched: MatchedIngredient | null; grams: number } {
  const g = Number.isFinite(grams) && grams > 0 ? grams : 0;
  if (!name.trim() || g <= 0) return { matched: null, grams: g };
  return {
    matched: {
      name: name.trim().toLowerCase(),
      per100: { ...per100 },
      grams: g,
      matchedName: name.trim().toLowerCase(),
    },
    grams: g,
  };
}

export interface Suggestion {
  key: string;
  label: string;
  per100: Macros;
  grams: number;
  type: EntryType;
  /** true = samo delimično poklapanje (podstring), ne egzaktan naziv. */
  partial: boolean;
}

/** Parsira "naziv 123g", "naziv 2 tbsp" itd. -> naziv + grams (najčešće jednostavno). */
function parseNameAndGrams(input: string): { name: string; grams: number } {
  const m = input.match(/^(.+?)\s*(\d+)\s*(g|kg|ml|l)?$/i);
  if (m) {
    const grams =
      m[2] && m[3]
        ? parseInt(m[2], 10) * (m[3].toLowerCase() === "kg" ? 1000 : 1)
        : 0;
    return { name: m[1].trim(), grams };
  }
  return { name: input.trim(), grams: 0 };
}

/**
 * Predlozi dok korisnik kuca — jela i namirnice.
 * Egzaktne stavke idu prvo (partial:false). Ako unos nije egzaktan,
 * prikazujemo i delimične predloge (partial:true) — kako za jela, tako i
 * za namirnice — da "piz" zaista ponudi "Pizza".
 * Napomena: prikaz podstring-jela NE znači da ih matchIngredient prihvata
 * podstringom (on i dalje pogađa jelo samo egzaktno, da "pancakes" ne
 * pogodi "rice flour pancakes" — to je namirnica u drugoj mapi).
 */
export function suggestIngredients(query: string): Suggestion[] {
  const { name, grams } = parseNameAndGrams(query);
  const q = translateSynonym(name.toLowerCase().trim());
  if (!q) return [];

  const out: Suggestion[] = [];
  const seen = new Set<string>();

  // 1) Egzaktna poklapanja (jela i namirnice) — partial:false
  pushExactDish(out, seen, q, grams);
  const exactKey = q in map ? q : singular(q) in map ? singular(q) : null;
  if (exactKey && !seen.has(exactKey)) {
    const matched = map[exactKey]?.per100;
    if (matched) {
      pushIngredientSuggestion(out, seen, exactKey, toMacros(matched), grams, false);
    }
  }

  // 2) Delimični predlozi — spajamo JELA i NAMIRNICE u jednu listu,
  //    pa sortiramo: prefiks (startsWith) pred svima, zatim kraće prvo.
  //    Tako "mi" → "Milk" dolazi pre "Milkshake", a "panc" → "Pancakes" ostaje ispred
  //    "Rice flour pancakes" (koji je tek podstring).
  const candidates: { key: string; type: "dish" | "ingredient" }[] = [];
  for (const key of Object.keys(dishEntries)) {
    if (key !== q && (key.startsWith(q) || q.startsWith(key) || key.includes(q))) {
      candidates.push({ key, type: "dish" });
    }
  }
  for (const key of Object.keys(map)) {
    if (key !== q && (key.startsWith(q) || q.startsWith(key) || key.includes(q))) {
      candidates.push({ key, type: "ingredient" });
    } else if (key !== q) {
      const kw = key.split(" ");
      const qWords = q.split(" ").filter(Boolean);
      const matchedWords = kw.filter((w) => qWords.includes(w)).length;
      if (matchedWords === qWords.length && matchedWords > 0) {
        candidates.push({ key, type: "ingredient" });
      }
    }
  }
  candidates.sort((a, b) => {
    const sa = scorePartial(q, a.key);
    const sb = scorePartial(q, b.key);
    if (sa !== sb) return sa - sb;
    return a.key.length - b.key.length;
  });

  for (const c of candidates.slice(0, 8)) {
    if (seen.has(c.key)) continue;
    if (c.type === "dish") {
      const matched = dishEntries[c.key]?.per100;
      if (!matched) continue;
      seen.add(c.key);
      out.push({
        key: `dish:${c.key}`,
        label: capitalize(c.key),
        per100: toMacros(matched),
        grams,
        type: "dish",
        partial: true,
      });
    } else {
      const m = matchIngredient(c.key);
      if (!m) continue;
      pushIngredientSuggestion(out, seen, c.key, m.per100, grams, true);
    }
  }

  return out.slice(0, 4);
}

function scorePartial(q: string, key: string): number {
  if (key.startsWith(q)) return 0;
  if (q.startsWith(key)) return 1;
  return 2;
}

function pushExactDish(out: Suggestion[], seen: Set<string>, q: string, grams: number): void {
  if (dishEntries[q]) {
    out.push({
      key: `dish:${q}`,
      label: capitalize(q),
      per100: toMacros(dishEntries[q]!.per100),
      grams,
      type: "dish",
      partial: false,
    });
    seen.add(q);
    return;
  }
  const ds = singular(q);
  if (dishEntries[ds]) {
    out.push({
      key: `dish:${ds}`,
      label: capitalize(ds),
      per100: toMacros(dishEntries[ds]!.per100),
      grams,
      type: "dish",
      partial: false,
    });
    seen.add(ds);
  }
}

function pushIngredientSuggestion(
  out: Suggestion[],
  seen: Set<string>,
  key: string,
  per100: Macros,
  grams: number,
  partial: boolean
) {
  const cooked = COOKED_OVERRIDE[key] ?? COOKED_OVERRIDE[singular(key)] ?? null;
  if (cooked) {
    if (!seen.has("cooked:" + key)) {
      seen.add("cooked:" + key);
      out.push({ key: `${key}:cooked`, label: `${capitalize(key)} (cooked)`, per100: cooked, grams, type: "ingredient", partial });
    }
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ key: `${key}:raw`, label: `${capitalize(key)} (raw)`, per100, grams, type: "ingredient", partial });
    }
  } else {
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ key, label: capitalize(key), per100, grams, type: "ingredient", partial });
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Vrati makroe za gramažu date namirnice. */
export function calcForGrams(name: string, grams: number): { matched: MatchedIngredient | null; grams: number } {
  const g = Number.isFinite(grams) && grams > 0 ? grams : 0;
  if (!name.trim() || g <= 0) {
    return { matched: null, grams: g };
  }
  const cooked = cookedPer100(name);
  if (!cooked || g <= 0) {
    return { matched: null, grams: g };
  }
  return {
    matched: {
      name: (matchIngredient(name)?.name) ?? name.trim().toLowerCase(),
      per100: { ...cooked },
      grams: g,
      matchedName: (matchIngredient(name)?.name) ?? name.trim().toLowerCase(),
    },
    grams: g,
  };
}

/** Iz sopstvenog recepta: izracunaj makroе za datum, koristi existing ingredient grams + mapu. */
export function calcFromIngredient(ing: Ingredient): { kcal: number; matched: boolean } {
  const g = ing.grams ?? 0;
  if (g <= 0) return { kcal: 0, matched: false };
  const m = matchIngredient(ing.name);
  if (!m) return { kcal: 0, matched: false };
  return { kcal: Math.round((m.per100.kcal * g) / 100), matched: true };
}

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type CalorieGoal = "lose" | "maintain" | "gain";

export interface CalorieProfile {
  gender: "male" | "female";
  kg: number;
  cm: number;
  age: number;
  activity: ActivityLevel;
  goal?: CalorieGoal;
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Kalorijska korekcija za cilj: lose = -500, maintain = 0, gain = +500. */
const GOAL_OFFSET: Record<CalorieGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

/** Mifflin-St Jeor BMR + faktor aktivnosti + korekcija za cilj -> dnevni kalorijski cilj. */
export function calculateMifflinGoal(p: CalorieProfile): number {
  const base = 10 * p.kg + 6.25 * p.cm - 5 * p.age + (p.gender === "male" ? 5 : -161);
  const maintenance = base * (ACTIVITY_MULTIPLIER[p.activity] ?? 1.2);
  return Math.round(maintenance + (GOAL_OFFSET[p.goal ?? "maintain"] ?? 0));
}
