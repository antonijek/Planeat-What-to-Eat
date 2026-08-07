import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

/** Granica ka čuvanju podešavanja korisnika (dnevni cilj kalorija i sl.). */
export const settingsService = {
  async getCalorieGoal(): Promise<number> {
    return (await getItem<number>(STORAGE_KEYS.calorieGoal)) ?? 2000;
  },

  async saveCalorieGoal(kcal: number): Promise<void> {
    await setItem(STORAGE_KEYS.calorieGoal, kcal);
  },
};
