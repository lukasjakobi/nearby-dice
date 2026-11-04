import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { PresetId } from '@/domain';
import { BottomSheet, IconBadge, ListGroup, Text, TextVariant, useTheme } from '@/ui';

import { rulesSummary } from '../view/rulesSummary';
import { PRESET_ICON } from './presetIcons';

type RulesSheetProps = { visible: boolean; preset: PresetId; onClose: () => void };

/**
 * "Regeln der Runde": the mode with what it is about, then every rule of the round, read-only.
 * Rules that differ from the classic game stand out; the rest stay quiet.
 */
export function RulesSheet({ visible, preset, onClose }: RulesSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('lobby.rulesTitle')}>
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 4 }}>
          <IconBadge
            icon={PRESET_ICON[preset]}
            color={colors.primary}
            onColor={colors.onPrimary}
            solid
            size={48}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text variant={TextVariant.CardTitle}>{t(`labels.preset.${preset}.title`)}</Text>
            <Text variant={TextVariant.Body} color="muted">
              {t(`labels.preset.${preset}.description`)}
            </Text>
          </View>
        </View>
        <ListGroup>
          {rulesSummary(t, preset).map((line) => (
            <View
              key={line.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                minHeight: 48,
                paddingHorizontal: 14,
              }}
            >
              <Text variant={TextVariant.Body} color="muted" style={{ flexShrink: 1 }}>
                {line.label}
              </Text>
              <Text
                variant={TextVariant.Body}
                weight={line.changed ? 600 : 400}
                color={line.changed ? 'primary' : 'ink'}
                align="right"
              >
                {line.value}
              </Text>
            </View>
          ))}
        </ListGroup>
      </ScrollView>
    </BottomSheet>
  );
}
