import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { PresetId } from '@/domain';
import { BottomSheet, Text, TextVariant, useTheme } from '@/ui';

import { rulesSummary } from '../view/rulesSummary';

type RulesSheetProps = { visible: boolean; preset: PresetId; onClose: () => void };

/** "Regeln der Runde": every rule of the round, read-only. */
export function RulesSheet({ visible, preset, onClose }: RulesSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('lobby.rulesTitle')}>
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
        {rulesSummary(t, preset).map((line) => (
          <View
            key={line.label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 4,
              borderTopWidth: 1,
              borderTopColor: colors.line,
            }}
          >
            <Text variant={TextVariant.Body} color="muted">
              {line.label}
            </Text>
            <Text variant={TextVariant.Body} weight={600} align="right">
              {line.value}
            </Text>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}
