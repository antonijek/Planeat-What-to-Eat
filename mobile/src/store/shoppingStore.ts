import { create } from "zustand";
import { ShoppingItem } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

interface ShoppingStore {
  items: ShoppingItem[];
  load: () => Promise<void>;
  addManual: (item: Omit<ShoppingItem, "id" | "isManual" | "isChecked" | "sourceRecipeIds">) => Promise<void>;
  addMany: (items: ShoppingItem[]) => Promise<void>;
  replaceMany: (items: ShoppingItem[]) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useShoppingStore = create<ShoppingStore>((set, get) => ({
  items: [],

  async load() {
    const items = (await getItem<ShoppingItem[]>(STORAGE_KEYS.shopping)) ?? [];
    set({ items });
  },

  async addManual({ name, amount, unit, category }) {
    const items = [
      ...get().items,
      { id: uid(), name, amount, unit, category, isManual: true, isChecked: false, sourceRecipeIds: [] },
    ];
    await setItem(STORAGE_KEYS.shopping, items);
    set({ items });
  },

  async addMany(newItems) {
    // saberi količine za iste sastojke
    const merged = [...get().items];
    for (const ni of newItems) {
      const idx = merged.findIndex(
        (m) => m.name.toLowerCase() === ni.name.toLowerCase() && !m.isManual
      );
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], amount: merged[idx].amount + ni.amount };
      } else {
        merged.push(ni);
      }
    }
    await setItem(STORAGE_KEYS.shopping, merged);
    set({ items: merged });
  },

  async replaceMany(newItems) {
    // NE sabira: za iste sastojke prepisuje količinu (iz planera — bez dupliranja na 2. klik)
    const merged = [...get().items];
    for (const ni of newItems) {
      const idx = merged.findIndex(
        (m) => m.name.toLowerCase() === ni.name.toLowerCase() && !m.isManual
      );
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], amount: ni.amount };
      } else {
        merged.push(ni);
      }
    }
    await setItem(STORAGE_KEYS.shopping, merged);
    set({ items: merged });
  },

  async toggle(id) {
    const items = get().items.map((i) =>
      i.id === id ? { ...i, isChecked: !i.isChecked } : i
    );
    await setItem(STORAGE_KEYS.shopping, items);
    set({ items });
  },

  async remove(id) {
    const items = get().items.filter((i) => i.id !== id);
    await setItem(STORAGE_KEYS.shopping, items);
    set({ items });
  },

  async clearChecked() {
    const items = get().items.filter((i) => !i.isChecked);
    await setItem(STORAGE_KEYS.shopping, items);
    set({ items });
  },
}));
