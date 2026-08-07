export interface MealMoment {
  id: string;
  emoji: string;
  label: string;
  categories: string[];
}

/**
 * "Meal moments" — how users actually think ("what for lunch?").
 * Svaki trenutak mapira se na kategorije iz baze recepata.
 */
export const MEAL_MOMENTS: MealMoment[] = [
  { id: "breakfast", emoji: "🍳", label: "Breakfast", categories: ["Breakfast"] },
  {
    id: "lunch",
    emoji: "🍽️",
    label: "Lunch",
    categories: [
      "Seafood",
      "Lamb",
      "Beef",
      "Pork",
      "Chicken",
      "Pasta",
      "Vegetarian",
      "Vegan",
      "Goat",
      "Miscellaneous",
    ],
  },
  {
    id: "dinner",
    emoji: "🌙",
    label: "Dinner",
    categories: [
      "Seafood",
      "Lamb",
      "Beef",
      "Pork",
      "Chicken",
      "Pasta",
      "Vegetarian",
      "Vegan",
      "Goat",
      "Miscellaneous",
    ],
  },
  { id: "dessert", emoji: "🍰", label: "Dessert", categories: ["Dessert"] },
  { id: "snack", emoji: "🍿", label: "Snack", categories: ["Starter", "Side"] },
];

export function recipesForMoment(
  recipes: { category: string }[],
  momentId: string | null
): { category: string }[] {
  if (!momentId) return recipes;
  const moment = MEAL_MOMENTS.find((m) => m.id === momentId);
  if (!moment) return recipes;
  const set = new Set(moment.categories);
  return recipes.filter((r) => set.has(r.category));
}
