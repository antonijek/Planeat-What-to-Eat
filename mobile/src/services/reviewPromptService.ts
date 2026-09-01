import * as StoreReview from "expo-store-review";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

/** Posle koliko skuvanih recepata tražimo ocenu (samo jednom, ikad). */
const COOKED_THRESHOLD = 3;

export const reviewPromptService = {
  /** Pozvati posle svakog "I cooked this" — pita za ocenu tek kad je korisnik pokazao stvarno angažovanje. */
  async notifyCooked(): Promise<void> {
    const alreadyPrompted = await getItem<boolean>(STORAGE_KEYS.reviewPrompted);
    if (alreadyPrompted) return;

    const count = (await getItem<number>(STORAGE_KEYS.reviewCookedCount)) ?? 0;
    const next = count + 1;
    await setItem(STORAGE_KEYS.reviewCookedCount, next);
    if (next < COOKED_THRESHOLD) return;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await setItem(STORAGE_KEYS.reviewPrompted, true);
    await StoreReview.requestReview();
  },
};
