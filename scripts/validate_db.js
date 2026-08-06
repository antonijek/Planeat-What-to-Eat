/**
 * SVEUKUPNA VALIDACIJA baze recepata.
 *
 * Proverava SVAKI sastojak na poznate klase grešaka i meri njihov
 * uticaj na ukupne kalorije recepta. Daje brojčani izveštaj.
 *
 * Klasе grešaka:
 *  A) kcal=0 za ne-vodu/ne-so (USDA nema Energy)
 *  B) kJ kao kcal (kcal>700 za ne-mast)
 *  C) absurdni makroi (carbs>95 ili fat>95 za ne-mast)
 *  D) opis ne odgovara nazivu (pogrešan food)
 *  E) 4-4-9 neslaganje (kcal vs makroi)
 */

const path = require("path");
const d = require(path.resolve(__dirname, "../data/recipes.json"));
const cache = require(path.resolve(__dirname, "../data/nutrition_cache.json"));

function singular(w) {
  if (/ies$/i.test(w)) return w.replace(/ies$/i, "y");
  if (/ves$/i.test(w)) return w.replace(/ves$/i, "f");
  if (/oes$/i.test(w)) return w.replace(/oes$/i, "o");
  if (/s$/i.test(w)) return w.slice(0, -1);
  return w;
}
const SYNONYMS = {
  chilli: "chili", chili: "chili", coriander: "cilantro", cilantro: "cilantro",
  eggplant: "aubergine", aubergine: "eggplant", courgette: "zucchini", zucchini: "zucchini",
  prawn: "shrimp", shrimp: "shrimp", stock: "broth", broth: "broth",
  pepper: "peppers", paprika: "paprika", biscuit: "biscuits", flour: "flour",
  sugar: "sugar", oil: "oil", milk: "milk", cheese: "cheese",
};
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function matches(key, desc) {
  if (!desc) return false;
  const dsc = desc.toLowerCase();
  const words = key.toLowerCase().replace(/[^a-z ]/g, " ").split(" ").filter((w) => w.length > 2);
  if (!words.length) return false;
  return words.every((w) => {
    const s = singular(w);
    const syn = SYNONYMS[s] || SYNONYMS[w] || null;
    const v = [w, s, s + "s", s + "es", syn, syn ? syn + "s" : null].filter(Boolean);
    return v.some((x) => new RegExp("(^|[^a-z])" + escapeRe(x) + "([^a-z]|$)").test(dsc));
  });
}

const isFat = (k) => /oil|butter|lard|shortening|ghee|suet|margarine|mayonnaise|tallow|goose fat/i.test(k);
const isWaterOrSalt = (k) => /water|salt/i.test(k);

const problems = { A: [], B: [], C: [], D: [], E: [] };
const freq = {};
const grams = {};
for (const r of d.recipes) for (const i of r.ingredients) {
  const k = i.name.trim().toLowerCase();
  freq[k] = (freq[k] || 0) + 1;
  grams[k] = (grams[k] || 0) + (i.grams || 0);
}

const seen = new Set();
for (const r of d.recipes) for (const i of r.ingredients) {
  const k = i.name.trim().toLowerCase();
  if (seen.has(k)) continue;
  seen.add(k);
  const c = cache[k];
  if (!c || c.missing) continue;
  const p = c.per100;
  if (!p) continue;
  const kcal = p.kcal, carbs = p.carbs, fat = p.fat, prot = p.protein;

  if (kcal === 0 && !isWaterOrSalt(k)) problems.A.push({ k, f: freq[k], g: grams[k] });
  if (kcal > 700 && !isFat(k)) problems.B.push({ k, f: freq[k], g: grams[k], kcal });
  if ((carbs > 95 && !/sugar|syrup|honey|molasses|treacle/i.test(k)) || (fat > 95 && !isFat(k))) problems.C.push({ k, f: freq[k], g: grams[k] });
  if (!matches(k, c.description)) problems.D.push({ k, f: freq[k], g: grams[k], desc: c.description });
  const mac = prot * 4 + carbs * 4 + fat * 9;
  if (kcal > 0 && mac > 0 && Math.abs(mac - kcal) / kcal > 0.5) problems.E.push({ k, f: freq[k], g: grams[k] });
}

const labels = {
  A: "kcal=0 (osim vode/soli)",
  B: "kJ kao kcal (kcal>700 za ne-mast)",
  C: "apsurdni makroi (carbs/fat >95)",
  D: "opis ne odgovara nazivu",
  E: "4-4-9 neslaganje >50%",
};

console.log("=== IZVEŠTAJ VALIDACIJE ===\n");
let totalImpact = 0;
for (const cls of ["A", "B", "C", "D", "E"]) {
  const list = problems[cls];
  if (list.length === 0) { console.log(`[${cls}] ${labels[cls]}: 0 ✅`); continue; }
  // uticaj: koliko grama pogrešnih sastojaka
  const impact = list.reduce((a, x) => a + (x.g || 0), 0);
  const pct = impact ? Math.round((impact / totalGrams()) * 100) : 0;
  console.log(`[${cls}] ${labels[cls]}: ${list.length} sastojaka, ~${impact}g (~${pct}% ukupne gramaže)`);
  for (const x of list.slice(0, 8)) {
    console.log(`     ${x.f}x ${x.k.padEnd(25)} ${x.g ? x.g + "g" : ""} ${x.kcal ? "kcal=" + x.kcal : ""} ${x.desc ? "| " + String(x.desc).slice(0, 35) : ""}`);
  }
  totalImpact += impact;
}
console.log("\n=== UKUPNO ===\n");
console.log("Ukupno problematičnih sastojaka:", new Set([...problems.A, ...problems.B, ...problems.C, ...problems.D, ...problems.E].map((x) => x.k)).size);

function totalGrams() {
  let t = 0;
  for (const r of d.recipes) for (const i of r.ingredients) t += i.grams || 0;
  return t;
}
