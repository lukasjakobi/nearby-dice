import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Chip, IconButton, IconName, Text, TextVariant } from '@/ui';

type GameHeaderProps = { roundLabel: string; onMenu: () => void; onHistory: () => void };

/** Top bar of the game: menu, round counter, and the score history as a named chip. */
export function GameHeader({ roundLabel, onMenu, onHistory }: GameHeaderProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.header}>
      <IconButton icon={IconName.Menu} label={t('game.menu')} onPress={onMenu} />
      <Text
        variant={TextVariant.SectionTitle}
        size={width <= 340 ? 16 : undefined}
        style={styles.title}
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {roundLabel}
      </Text>
      <Chip label={t('game.history')} leading={IconName.History} onPress={onHistory} />
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
