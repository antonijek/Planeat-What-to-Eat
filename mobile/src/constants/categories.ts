export const CATEGORIES = [
  "Beef",
  "Breakfast",
  "Chicken",
  "Dessert",
  "Goat",
  "Lamb",
  "Miscellaneous",
  "Pasta",
  "Pork",
  "Seafood",
  "Side",
  "Starter",
  "Vegan",
  "Vegetarian",
] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  lako: "Easy",
  srednje: "Medium",
  teško: "Hard",
};

export const MAX_PINNED = 5;
