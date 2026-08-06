import { PremiumType } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

export const PREMIUM_PRICES = {
  monthly: "2.99€/mesec",
  lifetime: "49.99€ jednokratno",
};

export interface PremiumState {
  type: PremiumType;
  expiresAt: string | null;
}

const FREE_DAILY_SPINS = 5;

// TESTING: dok razvijamo, sve je otključano (premium + neograničene vrtnje).
// Kada se završi, postavi na false da se vrati monetizacija.
const DEV_UNLOCK_ALL = true;

/**
 * Upravlja premium statusom i kvotom vrtnji.
 * SADA: lokalno u AsyncStorage.
 * KASNIJE (backend): server validira premium, ovde samo čitaš token/status.
 */
export const premiumService = {
  async getState(): Promise<PremiumState> {
    const st = await getItem<PremiumState>(STORAGE_KEYS.premium);
    return st ?? { type: "free", expiresAt: null };
  },

  async isPremium(): Promise<boolean> {
    if (DEV_UNLOCK_ALL) return true;
    const st = await this.getState();
    if (st.type === "lifetime") return true;
    if (st.type === "monthly" && st.expiresAt) {
      if (new Date(st.expiresAt).getTime() > Date.now()) return true;
      await this.setFree();
      return false;
    }
    return false;
  },

  async setFree(): Promise<void> {
    await setItem(STORAGE_KEYS.premium, { type: "free", expiresAt: null });
  },

  async setMonthly(expiresAt: Date): Promise<void> {
    await setItem(STORAGE_KEYS.premium, { type: "monthly", expiresAt: expiresAt.toISOString() });
  },

  async setLifetime(): Promise<void> {
    await setItem(STORAGE_KEYS.premium, { type: "lifetime", expiresAt: null });
  },

  /**
   * Koliko vrtnji je preostalo danas. Premium = neograničeno.
   * Free = FREE_DAILY_SPINS dnevno (od ove verzije: bez reklama, zaključano).
   */
  async remainingSpinsToday(): Promise<number | null> {
    if (await this.isPremium()) return null; // null = neograničeno
    const today = new Date().toDateString();
    const key = `${STORAGE_KEYS.premium}:spins:${today}`;
    const usedRaw = await getItem<number>(key);
    const used = usedRaw ?? 0;
    return Math.max(0, FREE_DAILY_SPINS - used);
  },

  async consumeSpin(): Promise<void> {
    if (await this.isPremium()) return;
    const today = new Date().toDateString();
    const key = `${STORAGE_KEYS.premium}:spins:${today}`;
    const usedRaw = await getItem<number>(key);
    await setItem(key, (usedRaw ?? 0) + 1);
  },
};
