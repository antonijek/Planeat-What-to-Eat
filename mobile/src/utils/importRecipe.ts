/**
 * Parsiranje slobodnog teksta recepta (kopiranog sa sajta) u komponente forme.
 *
 * Podržava uobičajene onlajn formate:
 *  - sekcije "Ingredients:" i "Instructions:"
 *  - sastojci u obliku "naziv | količina jedinica" ili "2 cups chicken"
 *  - numerisane ili sa bullet-listing uputstva
 *
 * Ne koristi nikakve eksterne biblioteke — čista heuristika.
 */

export interface ParsedImport {
  name: string;
  ingredientsText: string;
  instructionsText: string;
}

/** Vraća naziv iz prve nenaslovljene linije koja liči na naslov (bez brojeva/sastojaka). */
function guessName(lines: string[]): string {
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    // preskoči linije koje liče na sastojak (sadrže količinu) ili sekciju
    if (/^(ingredients|instructions|prep|total ?time|servings|notes)\s*:/i.test(t)) continue;
    if (/\b\d+\s*(g|kg|ml|oz|lb|cups|cup|tbsp|tsp|pcs|pieces|cloves|slices)\b/i.test(t)) continue;
    if (!/[?!.]$/.test(t) && t.length > 2 && t.length < 80) return t;
  }
  return "";
}

/** Parsira jednu liniju sastojka u "name | amount | unit" oblik za formu. */
function normalizeIngredientLine(line: string): string {
  const t = line.trim().replace(/^[-•*]+\s*/, "");
  if (!t) return "";

  // već u formatu "naziv | količina | jedinica" ili "naziv | količina jedinica"
  if (t.includes("|")) {
    const parts = t.split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts.join(" | ");
    return t;
  }

  // oblik "2 cups chicken" — količina onda jedinica naziv
  const m = t.match(/^([\d½¼¾]+(?:[\/\s.][\d]+)?)\s*([a-zA-Z]+)\s+(.+)$/);
  if (m) {
    const [, amt, unit, name] = m;
    const u = unit.replace(/s$/i, ""); // cup->cup, cups->cup
    return `${name.trim()} | ${amt} | ${u}`;
  }

  // samo "naziv" bez količine
  return `${t} | 1`;
}

/** Podeli tekst na sastojke i uputstva na osnovu sekcija (ili po fallback heuristiki). */
export function parseRecipeText(text: string): ParsedImport | null {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim());
  const lines = rawLines.filter(Boolean);

  let ingSection = -1;
  let instSection = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/ingredients?\s*:/i.test(lines[i])) ingSection = i;
    if (/instructions?\s*:|method\s*:/i.test(lines[i])) instSection = i;
  }

  let name = guessName(lines);
  let ingLines: string[] = [];
  let instLines: string[] = [];

  if (ingSection >= 0 || instSection >= 0) {
    const start = Math.min(
      ingSection >= 0 ? ingSection : lines.length,
      instSection >= 0 ? instSection : lines.length
    );
    const end = instSection >= 0 ? instSection : lines.length;

    if (ingSection >= 0) {
      ingLines = lines.slice(ingSection + 1, end);
    }
    if (instSection >= 0) {
      instLines = lines.slice(instSection + 1);
    }
    // naziv = neka linija pre prve sekcije
    if (!name) name = guessName(lines.slice(0, start));
  } else {
    // nema sekcija — probaj: prva linija naziv, ostatak sastojci
    if (lines.length >= 2) {
      name = name || lines[0];
      ingLines = lines.slice(1);
    } else {
      ingLines = lines;
    }
  }

  // očisti tekst uputstva: ukloni brojčane prefikse "1." / "1)"
  instLines = instLines
    .map((l) => l.replace(/^\d+[.)]\s*/, "").replace(/^[-•*]\s*/, ""))
    .filter(Boolean);

  const ingredientText = ingLines.map(normalizeIngredientLine).filter(Boolean).join("\n");
  const instructionText = instLines.join("\n");

  if (!ingredientText && !instructionText) return null;

  return { name, ingredientsText: ingredientText, instructionsText: instructionText };
}
