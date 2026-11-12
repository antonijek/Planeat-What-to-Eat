export const REVIEW_SPIN_THRESHOLD = 5;
export const REVIEW_COOKED_THRESHOLD = 3;

export interface ReviewPromptState {
  prompted: boolean;
  spinCount: number;
  cookedCount: number;
  firstUseDay: string | null;
}

export function shouldAskForReview(state: ReviewPromptState, today: string): boolean {
  if (state.prompted) return false;
  if (state.cookedCount >= REVIEW_COOKED_THRESHOLD) return true;
  // Ne pitamo prvog dana: korisnik prvo treba da stekne utisak o aplikaciji.
  const pastFirstDay = state.firstUseDay !== null && state.firstUseDay !== today;
  return pastFirstDay && state.spinCount >= REVIEW_SPIN_THRESHOLD;
}
