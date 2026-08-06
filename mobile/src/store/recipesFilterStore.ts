import { create } from "zustand";

export interface RecipesFilters {
  keto: boolean;
  lowCarb: boolean;
  highProtein: boolean;
  noSugar: boolean;
  healthy: boolean;
  treat: boolean;
  rich: boolean;
  vegetarian: boolean;
  areas: string[];
  maxPrep: number | null;
  maxKcal: number | null;
}

export const EMPTY_FILTERS: RecipesFilters = {
  keto: false,
  lowCarb: false,
  highProtein: false,
  noSugar: false,
  healthy: false,
  treat: false,
  rich: false,
  vegetarian: false,
  areas: [],
  maxPrep: null,
  maxKcal: null,
};

/**
 * Zajednički filteri za "šta imam" i pretragu. Živi u Zustand-u (globalno)
 * da preživi re-mount komponenti između tabova — isti skup čipova/query-a
 * se vidi i na Home i na Recepti, identično.
 */
interface RecipesFilterStore {
  query: string;
  haveIngredients: string[];
  ingredientInput: string;
  filters: RecipesFilters;
  setQuery: (q: string) => void;
  setIngredientInput: (s: string) => void;
  addIngredients: (names: string[]) => void;
  removeIngredient: (name: string) => void;
  clearIngredients: () => void;
  toggleFilter: (key: keyof RecipesFilters) => void;
  toggleMax: (key: "maxPrep" | "maxKcal", value: number) => void;
  toggleArea: (area: string) => void;
  clearAll: () => void;
}

export const useRecipesFilterStore = create<RecipesFilterStore>((set, get) => ({
  query: "",
  haveIngredients: [],
  ingredientInput: "",
  filters: { ...EMPTY_FILTERS },

  setQuery: (q) => set({ query: q }),
  setIngredientInput: (s) => set({ ingredientInput: s }),

  addIngredients: (names) => {
    const cur = get().haveIngredients;
    const next = [...cur];
    for (const n of names) {
      if (!next.includes(n)) next.push(n);
    }
    set({ haveIngredients: next, ingredientInput: "" });
  },

  removeIngredient: (name) =>
    set({ haveIngredients: get().haveIngredients.filter((i) => i !== name) }),

  clearIngredients: () => set({ haveIngredients: [] }),

  toggleFilter: (key) => {
    const f = get().filters;
    set({ filters: { ...f, [key]: !f[key] } });
  },

  toggleMax: (key, value) => {
    const f = get().filters;
    set({ filters: { ...f, [key]: f[key] === value ? null : value } });
  },

  toggleArea: (area) => {
    const f = get().filters;
    const cur = f.areas;
    const next = cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area];
    set({ filters: { ...f, areas: next } });
  },

  clearAll: () =>
    set({
      query: "",
      haveIngredients: [],
      ingredientInput: "",
      filters: { ...EMPTY_FILTERS },
    }),
}));
