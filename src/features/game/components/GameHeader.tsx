import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { IconButton, IconName, Text, TextVariant } from '@/ui';

type GameHeaderProps = { roundLabel: string; onMenu: () => void; onScoreboard: () => void };

/** Top bar of the game: menu, round title, scoreboard. */
export function GameHeader({ roundLabel, onMenu, onScoreboard }: GameHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <IconButton icon={IconName.Menu} label={t('game.menu')} onPress={onMenu} />
      <Text
        variant={TextVariant.SectionTitle}
        align="center"
        style={styles.title}
        accessibilityRole="header"
      >
        {roundLabel}
      </Text>
      <IconButton icon={IconName.Trophy} label={t('game.scoreboard')} onPress={onScoreboard} />
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
    paddingRight: 12,
    paddingBottom: 4,
  },
  title: { flex: 1 },
});
