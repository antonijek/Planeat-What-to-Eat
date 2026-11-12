import * as StoreReview from "expo-store-review";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";
import { ReviewPromptState, shouldAskForReview } from "../utils/reviewPrompt";
import { dateKeyForToday } from "./calorieLogService";

async function readState(): Promise<ReviewPromptState> {
  return {
    prompted: (await getItem<boolean>(STORAGE_KEYS.reviewPromptedV2)) ?? false,
    spinCount: (await getItem<number>(STORAGE_KEYS.reviewSpinCount)) ?? 0,
    cookedCount: (await getItem<number>(STORAGE_KEYS.reviewCookedCount)) ?? 0,
    firstUseDay: await getItem<string>(STORAGE_KEYS.reviewFirstUseDay),
  };
}

async function askIfDue(state: ReviewPromptState): Promise<void> {
  if (!shouldAskForReview(state, dateKeyForToday())) return;
  const available = await StoreReview.isAvailableAsync();
  if (!available) return;
  await setItem(STORAGE_KEYS.reviewPromptedV2, true);
  await StoreReview.requestReview();
}

export const reviewPromptService = {
  /** Pozvati kad korisnik zatvori rezultat vrtnje točka. */
  async notifySpin(): Promise<void> {
    const state = await readState();
    if (state.prompted) return;

    state.spinCount += 1;
    await setItem(STORAGE_KEYS.reviewSpinCount, state.spinCount);
    if (state.firstUseDay === null) {
      state.firstUseDay = dateKeyForToday();
      await setItem(STORAGE_KEYS.reviewFirstUseDay, state.firstUseDay);
    }
    await askIfDue(state);
  },

  /** Pozvati posle svakog "I cooked this". */
  async notifyCooked(): Promise<void> {
    const state = await readState();
    if (state.prompted) return;

    state.cookedCount += 1;
    await setItem(STORAGE_KEYS.reviewCookedCount, state.cookedCount);
    await askIfDue(state);
  },
};
