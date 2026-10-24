# Scoring rules

This page is the one place that says how Nearby Dice scores a game: every field of a score sheet,
the upper bonus, the further-Yatzy (joker) rule, what each preset changes and how totals add up.
Other documents link here instead of repeating it. For the overview, see [PRODUCT.md](../PRODUCT.md).

**Status:** **Confirmed.** The app scores exactly as written here. The unit test
`src/domain/__tests__/scoringExamples.test.ts` checks the example rolls, the joker examples and the
upper-bonus examples against the code.

## Terms

- **Turn:** one player's go. A turn has one to three rolls (three in every preset), then one field
  is written.
- **Field:** one row of a score sheet. A **sheet** holds each of its ruleset's fields once.
- **Struck:** a field written as 0 points.
- **Further Yatzy (joker):** five equal dice on a sheet whose Yatzy field holds 50. See
  [Further Yatzys](#further-yatzys).

## Sheets and fields

**Confirmed.** Fields are listed top to bottom in sheet order. The upper block is the same in all
three rulesets; each ruleset adds its own lower block.

| Ruleset                   | Fields per sheet | Turns per player (full game) | Upper bonus |
| ------------------------- | ---------------- | ---------------------------- | ----------- |
| Classic (Klassisch)       | 13               | 13                           | +35         |
| Classic XL (Klassisch XL) | 17               | 17                           | +35         |
| Yatzy                     | 15               | 15                           | +50         |

### Upper block (all rulesets)

Each upper field scores the sum of the dice showing its face.

| Field (German)  | Scores                    | Example roll  | Points |
| --------------- | ------------------------- | ------------- | ------ |
| Ones (Einser)   | Sum of the dice showing 1 | 1, 1, 3, 5, 6 | 2      |
| Twos (Zweier)   | Sum of the dice showing 2 | 2, 2, 2, 5, 6 | 6      |
| Threes (Dreier) | Sum of the dice showing 3 | 3, 3, 1, 6, 6 | 6      |
| Fours (Vierer)  | Sum of the dice showing 4 | 4, 4, 2, 4, 1 | 12     |
| Fives (Fünfer)  | Sum of the dice showing 5 | 5, 5, 2, 6, 1 | 10     |
| Sixes (Sechser) | Sum of the dice showing 6 | 6, 6, 1, 2, 4 | 12     |

### Classic

Sheet order: the upper block, then the fields below.

| Field (German) | Scores                                                            | Example roll  | Points |
| -------------- | ----------------------------------------------------------------- | ------------- | ------ |
| Dreierpasch    | Sum of all five dice if at least three show the same face; else 0 | 4, 4, 4, 2, 6 | 20     |
| Viererpasch    | Sum of all five dice if at least four show the same face; else 0  | 3, 3, 3, 3, 6 | 18     |
| Full House     | 25 for three equal dice and a pair of another face; else 0        | 2, 2, 5, 5, 5 | 25     |
| Kleine Straße  | 30 for four in a row (1–4, 2–5 or 3–6); else 0                    | 1, 3, 4, 5, 6 | 30     |
| Große Straße   | 40 for five in a row (1–5 or 2–6); else 0                         | 2, 3, 4, 5, 6 | 40     |
| Yatzy          | 50 for five equal dice; else 0                                    | 6, 6, 6, 6, 6 | 50     |
| Chance         | Sum of all five dice                                              | 1, 2, 3, 4, 6 | 16     |

### Classic XL

Sheet order: the upper block, then Zwei Paare, Gerade, Ungerade and Mini, then the seven Classic
fields above, ending with Chance.

| Field (German) | Scores                                                                                                                                             | Example roll  | Points |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ |
| Zwei Paare     | (Higher pair's face + lower pair's face) × 2 if two different faces each show at least twice; else 0. A full house counts; five equal dice do not. | 6, 6, 5, 5, 2 | 22     |
| Gerade         | Sum of the dice showing 2, 4 or 6; other dice add 0                                                                                                | 5, 1, 6, 6, 2 | 14     |
| Ungerade       | Sum of the dice showing 1, 3 or 5; other dice add 0                                                                                                | 5, 1, 6, 6, 2 | 6      |
| Mini           | 30 if the sum of all five dice is at most 10; else 0                                                                                               | 1, 2, 1, 3, 2 | 30     |

### Yatzy

Sheet order: the upper block, then the fields below.

| Field (German) | Scores                                                       | Example roll  | Points |
| -------------- | ------------------------------------------------------------ | ------------- | ------ |
| Ein Paar       | 2 × the highest face that at least two dice show; else 0     | 4, 4, 2, 5, 1 | 8      |
| Zwei Paare     | The same as in [Classic XL](#classic-xl)                     | 6, 6, 5, 5, 2 | 22     |
| Dreierpasch    | 3 × the highest face that at least three dice show; else 0   | 5, 5, 5, 2, 6 | 15     |
| Viererpasch    | 4 × the highest face that at least four dice show; else 0    | 3, 3, 3, 3, 6 | 12     |
| Kleine Straße  | 15 for 1–5; else 0                                           | 1, 2, 3, 4, 5 | 15     |
| Große Straße   | 20 for 2–6; else 0                                           | 2, 3, 4, 5, 6 | 20     |
| Full House     | Sum of all five dice for three equal dice and a pair; else 0 | 6, 6, 6, 2, 2 | 22     |
| Chance         | Sum of all five dice                                         | 1, 2, 3, 4, 6 | 16     |
| Yatzy          | 50 for five equal dice; else 0                               | 4, 4, 4, 4, 4 | 50     |

### Lucky number

**Confirmed.** With the lucky-number rule on, every sheet gets one more field, Glückszahl (Lucky
number), as its last field. The Glückszahl preset turns the rule on for Classic.

Each round has a target from 8 to 26. A round is every player's nth turn, so all players share one
target per round. The host draws it from the game's seed.

| Field (German) | Scores                                                           | Example roll (target 17) | Points |
| -------------- | ---------------------------------------------------------------- | ------------------------ | ------ |
| Glückszahl     | 40 if the five dice add up to the round's target exactly; else 0 | 3, 4, 4, 2, 4            | 40     |

## Upper bonus

**Confirmed.** Once a sheet's upper block adds up to 63 or more, the sheet earns the bonus below.
Each sheet has its own bonus. A further Yatzy's 50 counts toward the sum when it goes into an upper
field. Every preset uses the upper bonus.

| Ruleset             | Threshold | Bonus |
| ------------------- | --------- | ----- |
| Classic, Classic XL | 63        | +35   |
| Yatzy               | 63        | +50   |

Example: three of each face (Einser 3, Zweier 6, Dreier 9, Vierer 12, Fünfer 15, Sechser 18) sums to
63 and earns the bonus. Two of each face sums to 42 and earns nothing.

## Further Yatzys

**Confirmed.** Every ruleset and preset uses this rule. The code calls it the joker rule.

Once a sheet's Yatzy field holds 50, five equal dice on that sheet are a further Yatzy:

1. **Bonus:** each further Yatzy adds 50 to that sheet's total, whichever field it goes into.
2. **Where it goes:** the matching upper field (four 4s: Fours, which scores 50) or any open lower
   field, which scores that field's maximum from the table below. These fields may be chosen in any
   order.
3. **Fallback:** only when neither the matching upper field nor any lower field is open may any open
   field take it. It then scores its normal points, so an upper field other than the matching one
   scores 0.
4. **No joker:** while the Yatzy field holds 0 or is still open, five equal dice score normally and
   may go into any allowed field.
5. **Der Reihe nach:** the next open field is the only allowed one, and it scores by the same rule.
6. **Dreifach:** each sheet decides for itself. The bonus is part of the sheet total, so it gets that
   sheet's factor.

Example (Classic, Yatzy field holds 50, roll 4, 4, 4, 4, 4). Every row earns the +50 bonus:

| Fields open before the roll             | Field written | Points |
| --------------------------------------- | ------------- | ------ |
| Fours and the lower fields              | Fours         | 50     |
| Fours and the lower fields              | Full House    | 25     |
| Fours filled, lower fields open         | Chance        | 30     |
| Only Ones open (everything else filled) | Ones          | 0      |

With the Yatzy field struck (0), the same roll is an ordinary Chance: 20 points and no bonus.

Maximum points of each lower field with a further Yatzy (the `max` values in `src/domain/fields.ts`):

| Field (German)                | Classic and Classic XL | Yatzy   |
| ----------------------------- | ---------------------- | ------- |
| Matching upper field          | 50                     | 50      |
| Dreierpasch / Viererpasch     | 30 / 30                | 18 / 24 |
| Ein Paar / Zwei Paare         | – / 22 (XL)            | 12 / 22 |
| Full House                    | 25                     | 28      |
| Kleine / Große Straße         | 30 / 40                | 15 / 20 |
| Chance                        | 30                     | 30      |
| Gerade / Ungerade / Mini (XL) | 30 / 25 / 30           | –       |
| Glückszahl (if on)            | 40                     | 40      |

## Presets

**Confirmed.** The host picks one preset, and each game uses exactly that preset's rules. Every
preset uses three rolls per turn, the upper bonus and a random starting player.

| Preset (German)                | Ruleset    | Turns per player | What changes                                                                             |
| ------------------------------ | ---------- | ---------------- | ---------------------------------------------------------------------------------------- |
| Klassisch (Classic)            | Classic    | 13               | Nothing: free choice of field, no timer.                                                 |
| Der Reihe nach (Top to bottom) | Classic    | 13               | Only the next open field from the top may be written. 60 s per turn.                     |
| Blitz                          | Classic    | 6                | Short game: six turns each, and a sheet counts only its entries. 30 s per turn.          |
| Gleiche Würfel (Same dice)     | Classic    | 13               | Same dice for everyone: each player's nth turn and kth roll give the same dice.          |
| Dreifach (Triple)              | Classic    | 39               | Three sheets; each turn writes to one of them. The second sheet counts ×2, the third ×3. |
| Yatzy                          | Yatzy      | 15               | The [Yatzy](#yatzy) sheet.                                                               |
| Klassisch XL (Classic XL)      | Classic XL | 17               | The [Classic XL](#classic-xl) sheet.                                                     |
| Glückszahl (Lucky number)      | Classic    | 14               | Adds the [lucky-number field](#lucky-number).                                            |

### Timers

**Confirmed.** Der Reihe nach has 60 seconds per turn and Blitz 30 seconds; the other presets have no
limit. The clock starts when a turn starts. When it runs out, the app makes the move for the player:

1. If the player has not rolled yet, the dice are rolled.
2. It writes the allowed field with the most points, multiplied by the sheet's factor.
3. If no allowed field scores, it strikes the allowed field that is usually worth the least.

The history marks the entry as auto-scored.

## Totals

**Confirmed.**

| Total        | How it is formed                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Field        | Points as scored. A struck or still open field counts 0, so a Blitz sheet counts only its entries.                   |
| Upper bonus  | +35 or +50 when the upper block reaches 63 (see [Upper bonus](#upper-bonus)).                                        |
| Sheet total  | Sum of its fields, plus its upper bonus, plus 50 for each further Yatzy on that sheet.                               |
| Player total | Sum of the sheet totals, each multiplied by its factor: ×1 for the first sheet, ×2 for the second, ×3 for the third. |

Example (Dreifach, sheet totals 120, 90 and 60): 120 × 1 + 90 × 2 + 60 × 3 = 480.
