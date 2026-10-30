import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip, IconName } from '@/ui';

/** "‹ Zurück" above another player's sheet: back to the sheet of the player whose turn it is. */
export function SheetBackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <Chip label={t('common.back')} onPress={onPress} leading={IconName.Back} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4 },
});
