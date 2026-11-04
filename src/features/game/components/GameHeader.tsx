import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip, IconButton, IconName, Text, TextVariant } from '@/ui';

type GameHeaderProps = { roundLabel: string; onMenu: () => void; onScoreboard: () => void };

/** Top bar of the game: menu, round title, and the scoreboard as a named chip. */
export function GameHeader({ roundLabel, onMenu, onScoreboard }: GameHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <IconButton icon={IconName.Menu} label={t('game.menu')} onPress={onMenu} />
      <Text variant={TextVariant.SectionTitle} style={styles.title} accessibilityRole="header">
        {roundLabel}
      </Text>
      <Chip label={t('game.scoreboard')} leading={IconName.Trophy} onPress={onScoreboard} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    paddingLeft: 8,
    paddingRight: 16,
    paddingBottom: 4,
  },
  title: { flex: 1, paddingLeft: 4 },
});
