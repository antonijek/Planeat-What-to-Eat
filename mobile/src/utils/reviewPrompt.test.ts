import {
  REVIEW_COOKED_THRESHOLD,
  REVIEW_SPIN_THRESHOLD,
  ReviewPromptState,
  shouldAskForReview,
} from "./reviewPrompt";

const TODAY = "2026-11-12";
const YESTERDAY = "2026-11-11";

const base: ReviewPromptState = {
  prompted: false,
  spinCount: 0,
  cookedCount: 0,
  firstUseDay: YESTERDAY,
};

describe("shouldAskForReview", () => {
  it("asks after enough spins when today is not the first day", () => {
    expect(shouldAskForReview({ ...base, spinCount: REVIEW_SPIN_THRESHOLD }, TODAY)).toBe(true);
  });

  it("does not ask before the spin threshold", () => {
    expect(shouldAskForReview({ ...base, spinCount: REVIEW_SPIN_THRESHOLD - 1 }, TODAY)).toBe(false);
  });

  it("does not ask on the first day of use, even with many spins", () => {
    const state = { ...base, spinCount: 20, firstUseDay: TODAY };
    expect(shouldAskForReview(state, TODAY)).toBe(false);
  });

  it("does not ask when the first day of use is unknown", () => {
    const state = { ...base, spinCount: 20, firstUseDay: null };
    expect(shouldAskForReview(state, TODAY)).toBe(false);
  });

  it("asks after enough cooked recipes, even on the first day", () => {
    const state = { ...base, cookedCount: REVIEW_COOKED_THRESHOLD, firstUseDay: TODAY };
    expect(shouldAskForReview(state, TODAY)).toBe(true);
  });

  it("never asks twice", () => {
    const state = { ...base, prompted: true, spinCount: 50, cookedCount: 50 };
    expect(shouldAskForReview(state, TODAY)).toBe(false);
  });
});
