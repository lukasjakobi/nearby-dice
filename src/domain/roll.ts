/** Five dice, values 1–6. `0` = not rolled yet. */
export type Dice = readonly [number, number, number, number, number];

/** What rolled dice show, worked out once so that every field reads the same numbers. */
export type Roll = {
  /** counts[f] = number of dice showing face f (index 0 unused). */
  counts: readonly number[];
  sum: number;
  /** Highest number of equal dice. */
  most: number;
  /** Faces shown by at least two dice, highest first. */
  pairs: readonly number[];
};

export function faceCounts(dice: readonly number[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const die of dice) counts[die]++;

  return counts;
}

export function isRolled(dice: readonly number[]): boolean {
  return dice.every((die) => die >= 1 && die <= 6);
}

export function isYatzy(dice: readonly number[]): boolean {
  return isRolled(dice) && dice.every((die) => die === dice[0]);
}

/** Analyses rolled dice. Call it only once `isRolled` holds. */
export function analyseRoll(dice: Dice): Roll {
  const counts = faceCounts(dice);

  return {
    counts,
    sum: dice.reduce((total, die) => total + die, 0),
    most: Math.max(...counts.slice(1)),
    pairs: [6, 5, 4, 3, 2, 1].filter((face) => counts[face] >= 2),
  };
}
