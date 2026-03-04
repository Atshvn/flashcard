export type Sm2Result = {
  interval: number;
  easeFactor: number;
  masteryLevel: number;
  nextReviewDate: Date;
};

/**
 * SuperMemo-2 Spaced Repetition Algorithm
 * 
 * @param quality Quality of response (0-5)
 *  0: Complete blackout
 *  1: Incorrect, but remembered the correct one
 *  2: Incorrect, where correct one seemed easy to recall
 *  3: Correct, but after significant difficulty
 *  4: Correct, after hesitation
 *  5: Perfect response
 * @param easeFactor Current ease factor (default 2.5)
 * @param interval Current interval in days (default 1)
 * @param masteryLevel Current mastery level or consecutive correct repetitions (default 0)
 * @returns Resulting SM-2 metrics
 */
export function calculateSM2(
  quality: number,
  easeFactor: number = 2.5,
  interval: number = 1,
  masteryLevel: number = 0
): Sm2Result {
  let newMastery: number;
  let newInterval: number;
  let newEaseFactor: number = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  if (quality >= 3) { // Correct answer
    if (masteryLevel === 0) {
      newInterval = 1;
    } else if (masteryLevel === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newMastery = masteryLevel + 1;
  } else { // Incorrect
    newMastery = 0;
    newInterval = 1; // reset interval to 1 day on fail
  }

  // Adding days to current date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    masteryLevel: newMastery,
    nextReviewDate
  };
}

/**
 * Calculates Next Review Time based on simplified logic from the user prompt:
 * - If correct: interval = interval * ease_factor, ease_factor += 0.1
 * - If wrong: interval = 1, ease_factor -= 0.2
 * 
 * Maps boolean correct to equivalent quality.
 */
export function processAnswerSimple(
  isCorrect: boolean,
  easeFactor: number = 2.5,
  interval: number = 1,
  masteryLevel: number = 0
) {
  return calculateSM2(isCorrect ? 5 : 0, easeFactor, interval, masteryLevel);
}
