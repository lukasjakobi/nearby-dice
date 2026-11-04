/** "Endstand": each player's total, the gap to the winner and a bar of where the points came from. */
import type { TFunction } from '@/i18n';
import { yatzyCount } from '@/domain';
import type { Rules } from '@/domain';

import type { RankedPlayer, RankRow } from './rankingView';

/** One share of a bar, in the order it is drawn. */
export enum BarPart {
  Upper = 'upper',
  Bonus = 'bonus',
  Lower = 'lower',
}

/**
 * `points`, not `value`: the Reanimated Babel plugin treats any `x.value` read in a style as a
 * shared value and injects a warning that crashes Jest.
 */
export type BarSegment = { part: BarPart; points: number; label: string };

export type Standing = RankRow & {
  /** "+12" ahead of the next for a sole winner, "−12" behind the winner for everyone else. */
  gap: { text: string; lead: boolean } | null;
  /** Scored at least one Yatzy. */
  yatzy: boolean;
  /** Bar length against the winner's, 0–100. */
  barWidth: number;
  /** Empty shares are left out. */
  segments: BarSegment[];
  barLabel: string;
};

export type StandingsView = {
  /** The bar's parts that this game's rules have and at least one bar shows. */
  legend: BarPart[];
  rows: Standing[];
};

/** In ranking order. */
export function buildStandings(
  t: TFunction,
  ranked: readonly RankedPlayer[],
  rules: Rules,
): StandingsView {
  const legend = rules.upperBonus
    ? [BarPart.Upper, BarPart.Bonus, BarPart.Lower]
    : [BarPart.Upper, BarPart.Lower];
  const top = ranked[0]?.row.points ?? 0;
  const winners = ranked.filter(({ row }) => row.winner);
  const next = ranked.find(({ row }) => !row.winner);
  const lead = winners.length === 1 && next ? top - next.row.points : null;

  const rows = ranked.map(({ row, player }): Standing => {
    const parts: Record<BarPart, number> = {
      [BarPart.Upper]: row.upper,
      [BarPart.Bonus]: row.bonus,
      [BarPart.Lower]: row.lower,
    };

    return {
      ...row,
      gap: row.winner
        ? lead === null
          ? null
          : { text: `+${lead}`, lead: true }
        : { text: t('results.behind', { n: row.behind }), lead: false },
      yatzy: yatzyCount(player.sheets) > 0,
      barWidth: top > 0 ? (row.points / top) * 100 : 0,
      segments: legend
        .filter((part) => parts[part] > 0)
        .map((part) => ({
          part,
          points: parts[part],
          label: part === BarPart.Bonus ? `+${parts[part]}` : String(parts[part]),
        })),
      barLabel: [
        `${row.name}: ${t('format.points', { count: row.points })}`,
        legend.map((part) => `${t(`results.${part}`)} ${parts[part]}`).join(', '),
      ].join('. '),
    };
  });

  // A legend entry for a share nobody scored, like a bonus nobody reached, explains nothing.
  const drawn = legend.filter((part) =>
    rows.some((row) => row.segments.some((segment) => segment.part === part)),
  );

  return { legend: drawn, rows };
}
