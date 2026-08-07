import { Ingredient } from "../types";

/**
 * Množi količine sastojaka odnosom persons/servings.
 * Recepti su za celu seriju (servings), pa je faktor = persons / servings.
 * Ako servings nije poznat, tretira recept kao da je za 1 porciju (faktor = persons).
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  persons: number,
  servings?: number
): Ingredient[] {
  const base = Math.max(1, servings ?? 1);
  const factor = Math.max(1, persons) / base;
  return ingredients.map((ing) => ({
    ...ing,
    amount: ing.amount * factor,
  }));
}

/** Vrednost po porciji iz ukupne vrednosti recepta (servings||1). */
export function perServing(value: number, servings?: number): number {
  return value / Math.max(1, servings ?? 1);
}

/** perServing zaokruženo na ceo broj (za kcal/makroe u prikazu). */
export function perServingRound(value: number, servings?: number): number {
  return Math.round(perServing(value, servings));
}

/**
 * Parsira vodeći broj iz mere ("2 cups", "800g", "1 tsp").
 * Vraća { number | null, rest } — rest je ostatak teksta posle broja.
 */
function parseMeasure(measure: string): { number: number | null; rest: string } {
  const match = measure.trim().match(/^([\d.]+)\s*(.*)$/);
  if (!match) return { number: null, rest: measure.trim() };
  const num = parseFloat(match[1]);
  if (Number.isNaN(num)) return { number: null, rest: measure.trim() };
  return { number: num, rest: match[2].trim() };
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * Prikazuje meru skaliranu odnosom persons/servings.
 * "1 cup" (recept za 12, korisnik 12) → "1 cup". "1 cup" (korisnik 6) → "0.5 cup".
 */
export function scaleMeasure(measure: string, persons: number, servings?: number): string {
  const base = Math.max(1, servings ?? 1);
  const factor = Math.max(1, persons) / base;
  if (!measure || measure === "porcija") return measure;
  const { number, rest } = parseMeasure(measure);
  if (number === null) return measure;
  return `${formatNumber(number * factor)}${rest ? " " + rest : ""}`;
}

export function formatAmount(ing: Ingredient, persons: number = 1, servings?: number): string {
  if (ing.measure && ing.measure !== "porcija") {
    return scaleMeasure(ing.measure, persons, servings);
  }
  const base = Math.max(1, servings ?? 1);
  const factor = Math.max(1, persons) / base;
  return `${formatNumber(ing.amount * factor)} ${ing.unit}`.trim();
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Približna gramaža iz količine i jedinice (za ručno unete sastojke bez `grams`).
 * Vraća 0 ako jedinica nije prepoznata (npr. "kom", "pcs").
 */
export function gramsFromAmountAndUnit(amount: number, unit: string): number {
  const u = (unit || "").trim().toLowerCase().replace(/s$/, "");
  if (!u) return amount >= 0 ? amount : 0;
  switch (u) {
    case "g":
    case "gram":
    case "gr":
    case "ml":
    case "mililitar":
      return amount;
    case "kg":
    case "kilogram":
      return amount * 1000;
    case "cl":
    case "centilitar":
      return amount * 10;
    case "tbsp":
    case "tablespoon":
    case "supljena":
    case "velika kasika":
    case "kasika":
      return amount * 15;
    case "tsp":
    case "teaspoon":
    case "mala kasika":
    case "cajna kasika":
      return amount * 5;
    case "cup":
    case "sarpa":
    case "soljica":
      return amount * 150; // gruba procena (zavisi od namirnice)
    default:
      return 0;
  }
}

/** Približna gramaža jednog komada za poznate namirnice (npr. jaje ≈ 50g). */
const PIECE_GRAMS: Record<string, number> = {
  egg: 50, eggs: 50, jaje: 50, jaja: 50,
  onion: 110, luk: 110,
  garlic: 5,
  tomato: 90, tomatoes: 90, paradajz: 90,
  potato: 150, potatoes: 150, krompir: 150, krompiri: 150,
  apple: 150, jabuka: 150,
  banana: 120,
  carrot: 65, carrots: 65, shargarepa: 65,
  orange: 130, narandža: 130,
  pepper: 90, paprika: 90,
  lemon: 60, limun: 60,
  cucumber: 300, krastavac: 300,
  zucchini: 200, tikvica: 200,
  mushroom: 15, mushrooms: 15, pecurka: 15,
};

export function pieceApproxGrams(name: string, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u !== "kom" && u !== "pcs" && u !== "komad" && u !== "pc") return 0;
  const n = name.trim().toLowerCase();
  const fresh = Object.keys(PIECE_GRAMS).filter((k) => n.includes(k) || k.includes(n));
  if (fresh.length === 0) return 0;
  const best = fresh.sort((a, b) => b.length - a.length)[0];
  return PIECE_GRAMS[best];
}
