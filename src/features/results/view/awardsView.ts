/** The awards card: highest move, upper bonus and most zeros. */
import type { TFunction } from '@/i18n';
import { categoriesFor, upperBonusPoints } from '@/domain';
import type { Category, GamePlayer, Rules } from '@/domain';
import type { AvatarView } from '@/shared';

import type { RankedPlayer, RankRow } from './rankingView';

export enum AwardKind {
  BestMove = 'best-move',
  Bonus = 'bonus',
  Zeros = 'zeros',
}

export type Award = {
  kind: AwardKind;
  label: string;
  text: string;
  who: (AvatarView & { id: string })[];
};

type Entry = { category: Category; value: number };

/** In ranking order: `ranked` decides the order of `who`. */
export function buildAwards(t: TFunction, ranked: readonly RankedPlayer[], rules: Rules): Award[] {
  return rules.upperBonus
    ? [bestMoveAward(t, ranked, rules), bonusAward(t, ranked, rules), zerosAward(t, ranked, rules)]
    : [bestMoveAward(t, ranked, rules), zerosAward(t, ranked, rules)];
}

/** Every field a player wrote, across all sheets, with raw points (as on the card). */
const entries = (player: GamePlayer, rules: Rules): Entry[] =>
  player.sheets.flatMap((sheet) =>
    categoriesFor(rules).flatMap((category) => {
      const value = sheet.fields[category];

      return value === null || value === undefined ? [] : [{ category, value }];
    }),
  );

const avatarFor = (row: RankRow) => ({ id: row.id, ...row.avatar });
const names = (rows: readonly RankRow[]) => rows.map((row) => row.name).join(', ');

/** Höchster Zug: the highest single entry; ties show everyone who wrote it. */
function bestMoveAward(t: TFunction, ranked: readonly RankedPlayer[], rules: Rules): Award {
  const bests = ranked.flatMap(({ row, player }) => {
    const best = entries(player, rules).reduce<Entry | null>(
      (top, entry) => (!top || entry.value > top.value ? entry : top),
      null,
    );

    return best ? [{ row, best }] : [];
  });
  const bestValue = Math.max(0, ...bests.map(({ best }) => best.value));
  const holders = bests.filter(({ best }) => best.value === bestValue);
  const categories = new Set(holders.map(({ best }) => best.category));

  return {
    kind: AwardKind.BestMove,
    label: t('results.awards.bestMove'),
    text:
      bestValue === 0
        ? t('results.awards.none')
        : categories.size === 1
          ? `${t(`labels.category.${[...categories][0]}`)} · ${bestValue}`
          : String(bestValue),
    who: bestValue === 0 ? [] : holders.map(({ row }) => avatarFor(row)),
  };
}

function bonusAward(t: TFunction, ranked: readonly RankedPlayer[], rules: Rules): Award {
  const rows = ranked.map(({ row }) => row).filter((row) => row.bonus > 0);

  return {
    kind: AwardKind.Bonus,
    label: t('results.awards.bonus', { n: upperBonusPoints(rules.ruleset) }),
    text: rows.length ? names(rows) : t('results.awards.nobody'),
    who: rows.map(avatarFor),
  };
}

function zerosAward(t: TFunction, ranked: readonly RankedPlayer[], rules: Rules): Award {
  const counted = ranked.map(({ row, player }) => ({
    row,
    zeros: entries(player, rules).filter((entry) => entry.value === 0).length,
  }));
  const mostZeros = Math.max(0, ...counted.map(({ zeros }) => zeros));
  const rows =
    mostZeros > 0 ? counted.filter(({ zeros }) => zeros === mostZeros).map(({ row }) => row) : [];

  return {
    kind: AwardKind.Zeros,
    label: t('results.awards.zeros'),
    text: rows.length ? `${names(rows)} · ${mostZeros}` : t('results.awards.none'),
    who: rows.map(avatarFor),
  };
}
