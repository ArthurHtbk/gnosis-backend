export type Sm2State = {
  interval: number;
  repetitions: number;
  easeFactor: number;
};

export type Sm2Result = Sm2State & {
  nextReviewedAt: Date;
};

export function computeNextReview(state: Sm2State, now: Date = new Date()): Sm2Result {
  let { interval, repetitions, easeFactor } = state;

  repetitions += 1;

  if (repetitions === 1) interval = 1;
  else if (repetitions === 2) interval = 3;
  else interval = Math.round(interval * easeFactor);

  // croissance douce
  easeFactor = Math.max(1.3, easeFactor + 0.05);

  const nextReviewedAt = new Date(now);
  nextReviewedAt.setDate(nextReviewedAt.getDate() + interval);

  return {
    interval,
    repetitions,
    easeFactor,
    nextReviewedAt,
  };
}
