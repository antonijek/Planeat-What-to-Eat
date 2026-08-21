import { PremiumType } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

export const PREMIUM_PRICES = {
  monthly: "4.99€",
  yearly: "39€",
  lifetime: "69€",
};

export interface PremiumState {
  type: PremiumType;
  expiresAt: string | null;
}

const FREE_DAILY_SPINS = 5;

/** Trajanje besplatnog probnog perioda (u danima). */
export const TRIAL_DAYS = 7;

// TESTING: dok razvijamo, sve je otključano (premium + neograničene vrtnje).
// Kada se završi, postavi na false da se vrati monetizacija.
const DEV_UNLOCK_ALL = true;

/**
 * JEDNO PODEŠAVANJE za premium funkcije.
 *
 * Svaka funkcija ima flag da li je premium (true) ili slobodna (false).
 * Dok je DEV_UNLOCK_ALL = true, sve je otključano bez obzira na flagove.
 * Kada DEV_UNLOCK_ALL postaviš na false, samo funkcije sa premium: true
 * ostaju zaključane za free korisnike (osim tokom probnog perioda).
 */
export type PremiumFeature =
  | "wheelUnlimited" // Neograničene vrtnje točka
  | "haveIngredients" // "Šta imam kod kuće" (Home + Recipes)
  | "planer" // Planer obroka (ekran + dodavanje iz detalja)
  | "shopping" // Lista za kupovinu
  | "history" // "Šta sam skuvao"
  | "stats" // Statistika
  | "calorieTracker" // Kalorijski dnevnik (+ "Add to tracker" iz detalja)
  | "myRecipes" // Sopstveni recepti
  | "editRecipes" // Izmena recepata (override)
  | "darkTheme"; // Tamna tema

export const PREMIUM_FEATURES: Record<PremiumFeature, boolean> = {
  wheelUnlimited: true,
  haveIngredients: true,
  planer: true,
  shopping: true,
  history: true,
  stats: true,
  calorieTracker: true,
  myRecipes: true,
  editRecipes: true,
  darkTheme: true,
};

/** Da li je funkcija otključana za trenutni premium status i probni period? */
export function isFeatureUnlocked(
  feature: PremiumFeature,
  isPremium: boolean,
  trialActive = false
): boolean {
  if (DEV_UNLOCK_ALL) return true;
  if (!PREMIUM_FEATURES[feature]) return true; // slobodna funkcija
  if (isPremium) return true;
  return trialActive; // probni period
}

/**
 * Upravlja premium statusom, kvotom vrtnji i probnim periodom.
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
    if ((st.type === "monthly" || st.type === "yearly") && st.expiresAt) {
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

  async setYearly(expiresAt: Date): Promise<void> {
    await setItem(STORAGE_KEYS.premium, { type: "yearly", expiresAt: expiresAt.toISOString() });
  },

  async setLifetime(): Promise<void> {
    await setItem(STORAGE_KEYS.premium, { type: "lifetime", expiresAt: null });
  },

  // === Probni period ===

  /** Kraj probnog perioda (ISO) ili null ako trial nikad nije startovan. */
  async getTrialEnd(): Promise<string | null> {
    return getItem<string>(STORAGE_KEYS.trialEnd);
  },

  /** Da li je probni period trenutno aktivan (nije premium, ali trial traje). */
  async isTrialActive(): Promise<boolean> {
    if (await this.isPremium()) return false;
    const end = await this.getTrialEnd();
    if (!end) return false;
    return new Date(end).getTime() > Date.now();
  },

  /** Preostalo dana probnog perioda (ceo broj, 0 = istekao/nije startovan). */
  async getTrialDaysLeft(): Promise<number> {
    if (await this.isPremium()) return 0;
    const end = await this.getTrialEnd();
    if (!end) return 0;
    const ms = new Date(end).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.max(1, Math.ceil(ms / (24 * 3600 * 1000)));
  },

  /**
   * Startuje probni period ako ga korisnik još nije koristio.
   * Ako je premium ili je trial već istekao — ništa se ne menja.
   */
  async startTrialIfNeeded(): Promise<void> {
    if (await this.isPremium()) return;
    const end = await this.getTrialEnd();
    if (end) return; // već je startovan (aktivan ili istekao — ne dajemo drugi)
    await setItem(STORAGE_KEYS.trialEnd, new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000).toISOString());
  },

  /**
   * How many spins remain today. Premium = unlimited.
   * Free = FREE_DAILY_SPINS per day (from this version: no ads, locked).
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
