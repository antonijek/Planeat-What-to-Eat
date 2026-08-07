import { Favorite } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

/** Granica ka čuvanju omiljenih recepata i ocena korisnika. */
export const favoritesService = {
  async getFavorites(): Promise<Favorite[]> {
    return (await getItem<Favorite[]>(STORAGE_KEYS.favorites)) ?? [];
  },

  async saveFavorites(favorites: Favorite[]): Promise<void> {
    await setItem(STORAGE_KEYS.favorites, favorites);
  },

  async getRatings(): Promise<Record<string, number>> {
    return (await getItem<Record<string, number>>(STORAGE_KEYS.ratings)) ?? {};
  },

  async saveRatings(ratings: Record<string, number>): Promise<void> {
    await setItem(STORAGE_KEYS.ratings, ratings);
  },
};
