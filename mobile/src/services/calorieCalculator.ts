import { Ingredient } from "../types";
import ingredientMap from "../data/ingredient_map.json";
import dishMap from "../data/dish_map.json";
import { toEnglishIngredient, toEnglishDish, localizedIngredient, localizedDish, translateUnit, englishKeysByLocalizedPartial, englishDishKeysByLocalizedPartial, currentLang } from "../utils/ingredientTranslation";

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
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

// Keš ključeva — izbegava ponovni Object.keys() na svako kucanje u dnevniku.
const mapKeys = Object.keys(map);
const dishKeys = Object.keys(dishEntries);

function singular(w: string): string {
  if (/ies$/i.test(w)) return w.replace(/ies$/i, "y");
  if (/(s|oes)$/i.test(w)) return w.replace(/(s|oes)$/i, "");
  return w;
}

/** Srpski (i neki latinični) sinonimi → engleski ključ mape namirnica/jela. */
const SYNONYMS: Record<string, string> = {
  // osnovno
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
  margarin: "margarine",  pirinac: "rice",
  pirinač: "rice",
  hleb: "bread",
  hljeb: "bread",
  testo: "dough",
  testenina: "pasta",
  tjestenina: "pasta",
  makarone: "pasta",  rezanci: "noodles",
  spageti: "spaghetti",
  supa: "soup",
  čorba: "soup",
  corba: "soup",
  gulas: "goulash",
  gulaš: "goulash",
  pica: "pizza",
  palacinke: "pancakes",
  palačinke: "pancakes",
  kuvano: "stew",
  paprika: "sweet red peppers",
  "crvena paprika": "sweet red peppers",
  "slatka paprika": "sweet red peppers",
  "ljuta paprika": "peppers",  // meso
  piletina: "chicken",
  meso: "meat",
  govedina: "beef",  svinjetina: "pork",
  jagnjetina: "lamb",
  teletina: "veal",
  sljunka: "ham",
  šunka: "ham",
  slanina: "bacon",
  kobasica: "sausage",
  kobasice: "sausage",
  pasteta: "pate",
  pašteta: "pate",
  "mleveno meso": "ground beef",
  "mlevena govedina": "ground beef",
  cevapi: "cevapi",
  ćevapi: "cevapi",
  curufte: "meatballs",
  ćufte: "meatballs",
  pljeskavica: "burger",
  riba: "fish",
  tunjevina: "tuna",
  losos: "salmon",
  skusa: "mackerel",
  // povrće
  krompir: "potatoes",
  krompiri: "potatoes",
  luk: "onion",
  paradajz: "tomatoes",
  krastavac: "cucumber",
  kupus: "cabbage",
  cvekla: "beetroot",
  cveklu: "beetroot",
  mrkva: "carrots",
  mrkve: "carrots",
  šargarepa: "carrots",
  shargarepa: "carrots",
  tikvica: "zucchini",
  tikvice: "zucchini",
  patlidzan: "eggplant",
  patlidžan: "eggplant",
  brokoli: "broccoli",
  spanac: "spinach",
  spanać: "spinach",
  boranija: "green beans",
  pasulj: "beans",
  grah: "beans",
  leca: "lentils",
  leća: "lentils",
  socivo: "lentils",
  sočivo: "lentils",
  pecurke: "mushrooms",
  pečurke: "mushrooms",
  gljive: "mushrooms",
  karfiol: "cauliflower",
  salata: "salad",
  "zelena salata": "lettuce",
  // voće
  jabuka: "apple",
  jabuke: "apples",
  banana: "banana",
  banane: "bananas",
  narandza: "orange",
  narandža: "orange",
  pomorandza: "orange",
  pomorandža: "orange",
  limun: "lemon",
  limeta: "lime",
  grozdje: "grapes",
  grožđe: "grapes",
  jagode: "strawberries",
  borovnice: "blueberries",
  maline: "raspberries",
  breskva: "peaches",
  breskve: "peaches",
  kruska: "pears",
  kruška: "pears",
  lubenica: "watermelon",
  dinja: "melon",
  visnja: "cherries",
  višnja: "cherries",
  ananas: "pineapple",
  avokado: "avocado",
  // mlečni (jogurt/kajmak/sir su već gore)
  pavlaka: "sour cream",
  "kisela pavlaka": "sour cream",
  kackavalj: "cheese",
  kačkavalj: "cheese",
  mocarela: "mozzarella",
  vrhnje: "cream",
  "ovsena kasa": "oatmeal",
  "ovsena kaša": "oatmeal",
  musli: "muesli",
  kifla: "croissant",
  pecivo: "bread rolls",
  kinoa: "quinoa",
  bulgur: "bulgur",
  kukuruz: "sweetcorn",
  "kukuruzni hleb": "cornmeal",
  palenta: "polenta",
  // začini, slatkiši, pića
  med: "honey",
  kwasac: "yeast",
  kvasac: "yeast",
  cokolada: "dark chocolate",
  čokolada: "dark chocolate",
  kakao: "cocoa",
  kafa: "coffee",
  sok: "juice",
  voda: "water",
  pivo: "beer",
  vino: "wine",
  sladoled: "ice cream",
  kolač: "cake",
  kolac: "cake",
  torta: "cake",
  biskvit: "cake",
  keks: "cookies",
  przenice: "french toast",
  prženice: "french toast",
  omlet: "omelette",
  kajgana: "scrambled eggs",
  sendvic: "sandwich",
  sendvič: "sandwich",
  burger: "burger",
  rostilj: "grill",
  roštilj: "grill",
};

function translateSynonym(rawName: string): string {
  const key = rawName.trim().toLowerCase();
  if (SYNONYMS[key]) return SYNONYMS[key];
  // Pokušaj reverznu mapu trenutnog jezika (npr. "farine" -> "flour", "Suppe" -> "soup").
  const fromLang = toEnglishIngredient(key);
  if (fromLang && fromLang !== key) return fromLang;
  const fromDish = toEnglishDish(key);
  return fromDish && fromDish !== key ? fromDish : key;
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
  for (const key of mapKeys) {
    if (n.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, per100: toMacros(map[key]!.per100) };
    }
  }
  if (!best) {
    for (const key of mapKeys) {
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
    fiber: p.fiber ?? 0,
  };
}

/**
 * Namirnice koje drastično menjaju težinu i kalorije kuvanjem.
 * Koristi se SAMO u kalorijskom dnevniku (kad korisnik unese "šta je pojeo",
 * obično skuvano). Baza recepata se NE dira — ona i dalje računa sirovo.
 * Vrednosti su "kuvano" na 100 g.
 */
const COOKED_OVERRIDE: Record<string, Macros> = {
  // žitarice — kuvane apsorbuju vodu, kcal padne 2-3x
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
  // meso — kuvano gubi vodu, kcal blago raste po 100g
  chicken: { kcal: 189, protein: 28.7, fat: 7.4, carbs: 0 },
  "chicken breast": { kcal: 165, protein: 31, fat: 3.6, carbs: 0 },
  "chicken breast fillet": { kcal: 165, protein: 31, fat: 3.6, carbs: 0 },
  "chicken thigh": { kcal: 209, protein: 26, fat: 10.9, carbs: 0 },
  "chicken leg": { kcal: 184, protein: 24.2, fat: 8.2, carbs: 0 },
  "chicken drumstick": { kcal: 172, protein: 24.2, fat: 7.4, carbs: 0 },
  "chicken wing": { kcal: 203, protein: 30.5, fat: 8.1, carbs: 0 },
  beef: { kcal: 250, protein: 26, fat: 15, carbs: 0 },
  "ground beef": { kcal: 250, protein: 26, fat: 15, carbs: 0 },
  "lean ground beef": { kcal: 217, protein: 28, fat: 11, carbs: 0 },
  steak: { kcal: 271, protein: 25, fat: 19, carbs: 0 },
  "beef steak": { kcal: 271, protein: 25, fat: 19, carbs: 0 },
  pork: { kcal: 242, protein: 27, fat: 14, carbs: 0 },
  "pork chop": { kcal: 231, protein: 25.7, fat: 13.7, carbs: 0 },
  lamb: { kcal: 258, protein: 25.6, fat: 16.5, carbs: 0 },
  "minced beef": { kcal: 250, protein: 26, fat: 15, carbs: 0 },
  sausage: { kcal: 301, protein: 12, fat: 27, carbs: 2 },
  bacon: { kcal: 541, protein: 37, fat: 42, carbs: 1.4 },
  ham: { kcal: 145, protein: 20, fat: 6, carbs: 1 },
  // riba — kuvana gubi vodu
  salmon: { kcal: 206, protein: 22, fat: 12, carbs: 0 },
  tuna: { kcal: 184, protein: 29.1, fat: 6.3, carbs: 0 },
  cod: { kcal: 105, protein: 23, fat: 0.9, carbs: 0 },
  mackerel: { kcal: 262, protein: 24, fat: 18, carbs: 0 },
  shrimp: { kcal: 99, protein: 24, fat: 0.3, carbs: 0.2 },
  // jaja
  egg: { kcal: 155, protein: 13, fat: 11, carbs: 1.1 },
  eggs: { kcal: 155, protein: 13, fat: 11, carbs: 1.1 },
  // voće — sveže (baza ima neke "baked"/konzervirane varijante)
  banana: { kcal: 89, protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6 },
  bananas: { kcal: 89, protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6 },
  apple: { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  apples: { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  orange: { kcal: 47, protein: 0.9, fat: 0.1, carbs: 11.8, fiber: 2.4 },
  grapes: { kcal: 69, protein: 0.7, fat: 0.2, carbs: 18, fiber: 0.9 },
  strawberries: { kcal: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2 },
  blueberries: { kcal: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4 },
  raspberries: { kcal: 52, protein: 1.2, fat: 0.7, carbs: 11.9, fiber: 6.5 },
  watermelon: { kcal: 30, protein: 0.6, fat: 0.2, carbs: 7.6, fiber: 0.4 },
  melon: { kcal: 34, protein: 0.8, fat: 0.2, carbs: 8.2, fiber: 0.9 },
  cherries: { kcal: 50, protein: 1, fat: 0.3, carbs: 12, fiber: 1.6 },
  pineapple: { kcal: 50, protein: 0.5, fat: 0.1, carbs: 13.1, fiber: 1.4 },
  peaches: { kcal: 39, protein: 0.9, fat: 0.3, carbs: 9.5, fiber: 1.5 },
  pears: { kcal: 57, protein: 0.4, fat: 0.1, carbs: 15.2, fiber: 3.1 },
  lemon: { kcal: 29, protein: 1.1, fat: 0.3, carbs: 9.3, fiber: 2.8 },
  lime: { kcal: 30, protein: 0.7, fat: 0.2, carbs: 10.5, fiber: 2.8 },
  avocado: { kcal: 160, protein: 2, fat: 14.7, carbs: 8.5, fiber: 6.7 },
  // povrće — kuvano apsorbuje vodu, kcal padne
  broccoli: { kcal: 35, protein: 2.4, fat: 0.4, carbs: 7.2 },
  carrots: { kcal: 35, protein: 0.8, fat: 0.2, carbs: 8.2 },
  carrot: { kcal: 35, protein: 0.8, fat: 0.2, carbs: 8.2 },
  "green beans": { kcal: 35, protein: 1.9, fat: 0.3, carbs: 7.9 },
  spinach: { kcal: 23, protein: 3, fat: 0.3, carbs: 3.8 },
  cauliflower: { kcal: 23, protein: 1.8, fat: 0.5, carbs: 5.3 },
  cabbage: { kcal: 23, protein: 1.3, fat: 0.1, carbs: 5.5 },
  zucchini: { kcal: 17, protein: 1.1, fat: 0.3, carbs: 3.1 },
  eggplant: { kcal: 35, protein: 0.8, fat: 0.2, carbs: 8.7 },
  corn: { kcal: 96, protein: 3.4, fat: 1.5, carbs: 21 },
  peas: { kcal: 81, protein: 5.4, fat: 0.4, carbs: 14 },
  "sweet corn": { kcal: 96, protein: 3.4, fat: 1.5, carbs: 21 },
  // mlečni — uobičajene vrednosti za dnevnik
  yogurt: { kcal: 63, protein: 3.5, fat: 1.7, carbs: 7.5, fiber: 0 },
  milk: { kcal: 61, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0 },
  cheese: { kcal: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0 },
  butter: { kcal: 717, protein: 0.9, fat: 81, carbs: 0.1, fiber: 0 },
  "sour cream": { kcal: 196, protein: 3.1, fat: 18, carbs: 5.6, fiber: 0 },
  cream: { kcal: 340, protein: 2.8, fat: 36, carbs: 2.8, fiber: 0 },
  honey: { kcal: 304, protein: 0.3, fat: 0, carbs: 82, fiber: 0.2 },
  sugar: { kcal: 387, protein: 0, fat: 0, carbs: 100, fiber: 0 },
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

/**
 * Parsira "naziv 123g", "123g naziv", "naziv 2 tbsp", "1/2 šolje mleka" itd.
 * Vraća naziv bez količine + grams (ako je jedinica g/kg/ml/l prepoznata).
 */
export function parseNameAndGrams(input: string): { name: string; grams: number } {
  const t = input.trim();
  // Broj na kraju: "piletina 200g", "piletina 200 g", "mleko 0.5l"
  let m = t.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|gr)\s*$/i);
  if (m && m[1]) {
    const grams = parseFloat(m[2].replace(",", ".")) * (m[3].toLowerCase() === "kg" ? 1000 : 1);
    return { name: m[1].trim(), grams };
  }
  // Broj na početku: "200g piletina", "200 g piletina"
  m = t.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|gr)\s+(.*)$/i);
  if (m && m[3]) {
    const grams = parseFloat(m[1].replace(",", ".")) * (m[2].toLowerCase() === "kg" ? 1000 : 1);
    return { name: m[3].trim(), grams };
  }
  return { name: t, grams: 0 };
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
  const candidates: { key: string; type: "dish" | "ingredient"; priority?: number }[] = [];
  for (const key of dishKeys) {
    if (key !== q && (key.startsWith(q) || q.startsWith(key) || key.includes(q))) {
      candidates.push({ key, type: "dish" });
    }
  }
  for (const key of mapKeys) {
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

  // 3) Delimični unos na trenutnom jeziku (npr. srpski "ovseno" -> "oat flour").
  //    Tražimo sastojke čiji PREVOD sadrži unos, pa dodajemo njihove engleske ključeve
  //    sa VISOKIM prioritetom (skor 0) — jer unos je na srpskom, a engleske sugestije
  //    su nebitne dok korisnik kuca na svom jeziku.
  if (name.trim()) {
    for (const enKey of englishKeysByLocalizedPartial(name)) {
      if (!seen.has(enKey) && mapKeys.includes(enKey)) {
        candidates.push({ key: enKey, type: "ingredient", priority: 0 });
      }
    }
    // Jela: lokalizovani naziv ("Suppe", "Pfannkuchen", "pica") -> engleski ključ dish_map.
    for (const enKey of englishDishKeysByLocalizedPartial(name)) {
      if (!seen.has(enKey) && dishKeys.includes(enKey)) {
        candidates.push({ key: enKey, type: "dish", priority: 0 });
      }
    }
  }

  candidates.sort((a, b) => {
    const pa = a.priority ?? 9;
    const pb = b.priority ?? 9;
    if (pa !== pb) return pa - pb;
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
        label: capitalize(localizedDish(c.key)),
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
      label: capitalize(localizedDish(q)),
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
      label: capitalize(localizedDish(ds)),
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
  const localized = (k: string) => capitalize(localizedIngredient(k));
  const cookedLabel = capitalize(translateUnit("cooked"));
  const rawLabel = capitalize(translateUnit("raw"));
  if (cooked) {
    if (!seen.has("cooked:" + key)) {
      seen.add("cooked:" + key);
      out.push({ key: `${key}:cooked`, label: `${localized(key)} (${cookedLabel})`, per100: cooked, grams, type: "ingredient", partial });
    }
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ key: `${key}:raw`, label: `${localized(key)} (${rawLabel})`, per100, grams, type: "ingredient", partial });
    }
  } else {
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ key, label: localized(key), per100, grams, type: "ingredient", partial });
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
