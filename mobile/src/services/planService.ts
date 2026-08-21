import { Ingredient, MealPlanEntry } from "../types";
import { getPlan, setPlan } from "../storage/planStorage";
import { recipeService } from "./recipeService";
import { overrideService } from "./overrideService";

export interface ShoppingIngredient {
  name: string;
  amount: number;
  unit: string;
}

export const planService = {
  async getPlan(): Promise<MealPlanEntry[]> {
    return getPlan();
  },

  async savePlan(plan: MealPlanEntry[]): Promise<void> {
    await setPlan(plan);
  },

  async upsert(entry: MealPlanEntry): Promise<MealPlanEntry[]> {
    const plan = await getPlan();
    const idx = plan.findIndex(
      (p) => p.dayOfWeek === entry.dayOfWeek && p.mealType === entry.mealType
    );
    if (idx >= 0) plan[idx] = entry;
    else plan.push(entry);
    await setPlan(plan);
    return plan;
  },

  async remove(dayOfWeek: number, mealType: "lunch" | "dinner"): Promise<MealPlanEntry[]> {
    const plan = await getPlan();
    const next = plan.filter((p) => !(p.dayOfWeek === dayOfWeek && p.mealType === mealType));
    await setPlan(next);
    return next;
  },

  /** Sabira sve sastojke iz planiranih obroka u jednu listu za kupovinu. */
  async getShoppingIngredients(): Promise<ShoppingIngredient[]> {
    const plan = await getPlan();
    const totals = new Map<string, ShoppingIngredient>();

    for (const entry of plan) {
      // obuhvata i sopstvene (user-) recepte; ako ne postoji preskoči
      const base = await recipeService.getByIdAny(entry.recipeId);
      if (!base) continue;
      // override primeni samo na bazične recepte (user- nemaju override)
      let ingredients: Ingredient[];
      let servings = base.servings || 1;
      if (entry.recipeId.startsWith("user-")) {
        ingredients = base.ingredients;
      } else {
        // getEffective može da baci ako se override pozove na nepostojećem
        try {
          const effective = await overrideService.getEffective(entry.recipeId);
          ingredients = effective.ingredients ?? base.ingredients;
          if (effective.servings) servings = effective.servings;
        } catch {
          ingredients = base.ingredients;
        }
      }
      for (const ing of ingredients) {
        const key = ing.name.toLowerCase();
        const grams = ing.grams ?? 0;
        // bez gramaže ili 0g (npr. "pinch", "to taste", "salt") ne možemo reći koliko kupiti — preskoči
        if (grams <= 0) continue;
        // sastojci pokrivaju CELU seriju (servings), pa se količina skalira odnosom osoba/servings
        const qty = grams * (entry.persons / servings);
        const cur = totals.get(key);
        if (cur) {
          cur.amount += qty;
        } else {
          totals.set(key, {
            name: ing.name,
            amount: qty,
            unit: "g",
          });
        }
      }
    }
    return Array.from(totals.values());
  },
};
