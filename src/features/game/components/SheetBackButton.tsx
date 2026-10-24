import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconName, Text, useTheme } from '@/ui';

/** "‹ Zurück" above another player's sheet: back to the sheet of the player whose turn it is. */
export function SheetBackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
        style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}
      >
        <Icon name={IconName.Back} color={colors.ink} size={16} />
        <Text size={13} weight={600}>
          {t('common.back')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 10,
    paddingRight: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
});
