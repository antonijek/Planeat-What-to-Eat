import { Recipe } from "../types";
import recipesData from "../data/recipes.json";
import { myRecipesService } from "./myRecipesService";
import { toEnglishIngredient, englishAliases } from "../utils/ingredientTranslation";

const RECIPES: Recipe[] = (recipesData as { recipes: Recipe[] }).recipes;

/** Ukloni skrivene/neprave znakove (npr. \u200b, \u00a0, \uFEFF) i spusti u lowercase. */
function cleanIngredient(s: string): string {
  return s
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u034F\u180E\u2060]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Repository za recepte.
 *
 * SADA: čita iz lokalnog bundlesanog JSON fajla (radi offline, instant).
 * KASNIJE (backend): samo promeniš implementaciju funkcija ispod da
 * pozivaju Laravel API (npr. `api.get("/recipes")`). Ekrani se ne diraju.
 */
export const recipeService = {
  getAll(): Recipe[] {
    return RECIPES;
  },

  /** Sve recepte uključujući sopstvene (za točak i pretragu). */
  async getAllIncludingUser(): Promise<Recipe[]> {
    const mine = await myRecipesService.getAll();
    return [...RECIPES, ...mine];
  },

  async getByIdAny(id: string): Promise<Recipe | undefined> {
    if (id.startsWith("user-")) {
      return (await myRecipesService.getById(id)) ?? undefined;
    }
    return RECIPES.find((r) => r.id === id);
  },

  getById(id: string): Recipe | undefined {
    return RECIPES.find((r) => r.id === id);
  },

  search(query: string): Recipe[] {
    const q = query.trim().toLowerCase();
    if (!q) return RECIPES;
    // Pretraga radi na engleskim vrednostima originala. Ako korisnik upiše
    // sastojak na svom jeziku, prevedi ga na engleski preko reverzne mape.
    const needles = englishAliases(q);
    return RECIPES.filter(
      (r) =>
        needles.some((n) => r.name.toLowerCase().includes(n)) ||
        r.ingredients.some((i) => {
          const ingName = cleanIngredient(i.name);
          return needles.some((n) => ingName.includes(n));
        })
    );
  },

  /**
   * "Šta imam kod kuće": recepti koji sadrže SVE unete namirnice.
   * Robusno čisti unose (uklanja skrivene znakove poput \u200b, \u00a0),
   * pa svaki mora biti prisutan u bar jednom sastojku recepta.
   */
  findByIngredients(ingredients: string[]): Recipe[] {
    const input = ingredients
      .map((i) => cleanIngredient(i))
      .map((i) => toEnglishIngredient(i)) // "poulet" -> "chicken"
      .filter(Boolean);
    // ako korisnik želi filter ali je sve prazno, ne prikazuj sve — vrati prazno
    if (ingredients.some((i) => i.trim()) && input.length === 0) return [];
    if (input.length === 0) return RECIPES;
    return RECIPES.filter((r) =>
      input.every((need) =>
        r.ingredients.some((ing) => cleanIngredient(ing.name).includes(need))
      )
    );
  },

  /**
   * Kombinovani filteri (AND) po nutritivnim vrednostima.
   * Sve zadate opcije moraju biti zadovoljene.
   * Vrednosti računamo PO PORCIJI (kcal/porciji, g/porciji).
   */
  filterMatched(
    f: {
      keto?: boolean;
      lowCarb?: boolean;
      highProtein?: boolean;
      noSugar?: boolean;
      healthy?: boolean;
      treat?: boolean;
      rich?: boolean;
      vegetarian?: boolean;
      areas?: string[];
      maxPrep?: number; // brzo
      maxKcal?: number;
    },
    source?: Recipe[]
  ): Recipe[] {
    const list = source ?? RECIPES;
    const areaSet = f.areas && f.areas.length ? new Set(f.areas.map((a) => a.toLowerCase())) : null;
    return list.filter((r) => {
      const s = r.servings || 1;
      const kcalP = r.calories ? r.calories / s : 0;
      const carbP = r.carbs ? r.carbs / s : 0;
      const protP = r.protein ? r.protein / s : 0;
      const fiberP = r.fiber ? r.fiber / s : 0;
      const satP = r.saturatedFat ? r.saturatedFat / s : 0;
      const added = r.addedSugar ?? r.sugars ?? 0;
      const sugarP = added / s;

      if (areaSet && !areaSet.has((r.area || "").toLowerCase())) return false;
      if (f.keto && !(carbP <= 10)) return false;
      if (f.lowCarb && !(carbP <= 15)) return false;
      if (f.highProtein && !(protP >= 20)) return false;
      if (f.noSugar) {
        // za nema podataka o seceru ne mozemo tvrditi da je "no sugar"
        if (r.addedSugar == null && r.sugars == null) return false;
        if (!(sugarP < 3)) return false;
      }
      if (f.healthy) {
        if (fiberP < 4 || satP > 8 || sugarP >= 10) return false;
      }
      if (f.treat) {
        // "poštovanje": kalorično/masno/slatko — ako kcalP > 700 ili satP > 15 ili sugarP > 20
        if (!(kcalP > 700 || satP > 15 || sugarP > 20)) return false;
      }
      if (f.rich) {
        // "kalorično i masno": visoka kcal/porciji i visoka mast — za ljude koji žele obilan obrok
        if (!(kcalP > 600 && r.fats && r.fats / s > 25)) return false;
      }
      if (f.vegetarian) {
        const meatish =
          /chicken|beef|pork|steak|mince|lamb|sausage|bacon|fish|shrimp|prawn|turkey|duck|ham|chorizo|salmon|tuna|anchovy|sardine|meat|prosciutto|salami|bologna/i;
        if (r.ingredients.some((i) => meatish.test(i.name))) return false;
      }
      if (f.maxPrep != null && !(r.prepTime <= f.maxPrep)) return false;
      if (f.maxKcal != null && !(kcalP <= f.maxKcal)) return false;
      return true;
    });
  },
};
