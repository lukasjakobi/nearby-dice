import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Font, Text, fontFamily, useTheme } from '@/ui';

import type { PlayerBoard } from '../view';
import { BonusProgress } from './BonusProgress';
import { ScoreboardRow } from './ScoreboardRow';

type PlayerSheetProps = { player: PlayerBoard; factors: string | null };

/**
 * One player's whole sheet on "Spielstand": the upper block with its bonus, the lower
 * block, and the total at the bottom. The factors (×1 ×2 ×3) head the sheet when there are
 * several.
 */
export function PlayerSheet({ player, factors }: PlayerSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.sheet}>
      {factors ? (
        <Text size={12} color="muted" align="right" numberOfLines={1}>
          {factors}
        </Text>
      ) : null}
      <View style={styles.block}>
        <Text size={12} weight={600} color="muted" style={styles.blockTitle}>
          {t('game.upperBlock').toUpperCase()}
        </Text>
        {player.upper.map((row) => (
          <ScoreboardRow key={row.key} row={row} />
        ))}
        {player.bonus ? <BonusProgress bonus={player.bonus} /> : null}
      </View>
      <View style={styles.block}>
        <Text size={12} weight={600} color="muted" style={styles.blockTitle}>
          {t('game.lowerBlock').toUpperCase()}
        </Text>
        {player.lower.map((row) => (
          <ScoreboardRow key={row.key} row={row} />
        ))}
      </View>
      <View style={[styles.total, { backgroundColor: colors.surface2 }]}>
        <Text size={15} weight={600}>
          {t('game.total')}
        </Text>
        <Text
          size={26}
          color="primary"
          style={{ fontFamily: fontFamily(Font.Display, 700) }}
          accessibilityLabel={`${t('game.total')}: ${player.total}`}
        >
          {player.total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: 14 },
  block: { gap: 2 },
  blockTitle: { paddingHorizontal: 4, paddingBottom: 4, letterSpacing: 0.5 },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
