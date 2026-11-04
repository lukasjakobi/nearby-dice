import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { PRESET_ORDER } from '@/domain';
import type { PresetId } from '@/domain';
import {
  alpha,
  Chip,
  EDGE,
  Icon,
  IconBadge,
  IconName,
  RADIUS,
  Section,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';

import { PRESET_ICON } from './presetIcons';

const COLUMNS = 4;

/** Rows of four; a short last row keeps its tiles at the same width. */
const rows = (ids: readonly PresetId[]) =>
  Array.from({ length: Math.ceil(ids.length / COLUMNS) }, (_, i) =>
    ids.slice(i * COLUMNS, (i + 1) * COLUMNS),
  );

type PresetGridProps = {
  value: PresetId;
  onChange: (id: PresetId) => void;
  /** Which presets to offer, in display order. */
  presets?: readonly PresetId[];
  /** Opens the rules of the chosen preset, from the "Regeln" chip on its card. */
  onRules: () => void;
};

/**
 * "Spielstil": the presets as a dock of icon tiles, four per row, and below them a card that says
 * what the chosen one is about, with its rules a tap away.
 */
export function PresetGrid({ value, onChange, presets = PRESET_ORDER, onRules }: PresetGridProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Section title={t('hostSetup.styleLabel')} gap={14}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('hostSetup.styleLabel')}
        style={{ gap: 12 }}
      >
        {rows(presets).map((row) => (
          <View key={row.join()} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((id) => {
              const selected = id === value;
              const title = t(`labels.preset.${id}.title`);

              return (
                <Pressable
                  key={id}
                  onPress={() => onChange(id)}
                  accessibilityRole="radio"
                  accessibilityLabel={title}
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <View
                    style={{
                      alignSelf: 'stretch',
                      aspectRatio: 1.15,
                      borderRadius: RADIUS.card,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.primary : colors.line,
                      // Unchosen tiles stand up to be tapped; the chosen one is pressed in.
                      borderBottomWidth: selected ? 1.5 : EDGE,
                      borderBottomColor: selected ? colors.primary : colors.line,
                      transform: [{ translateY: selected ? EDGE - 1.5 : 0 }],
                      backgroundColor: selected ? colors.primary : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={PRESET_ICON[id]}
                      color={selected ? colors.onPrimary : colors.ink}
                      size={30}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    variant={TextVariant.Small}
                    weight={600}
                    align="center"
                    color={selected ? 'ink' : 'muted'}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                </Pressable>
              );
            })}
            {Array.from({ length: COLUMNS - row.length }, (_, i) => (
              <View key={i} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>

      <View
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          gap: 14,
          padding: 16,
          borderRadius: RADIUS.card,
          borderWidth: 1.5,
          // Tinted like the chosen tile, so the card reads as its explanation.
          borderColor: alpha(colors.primary, 0.35),
          backgroundColor: alpha(colors.primary, 0.08),
        }}
      >
        <IconBadge
          icon={PRESET_ICON[value]}
          color={colors.primary}
          onColor={colors.onPrimary}
          solid
          size={44}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant={TextVariant.CardTitle}>{t(`labels.preset.${value}.title`)}</Text>
          <Text variant={TextVariant.Body} color="muted">
            {t(`labels.preset.${value}.description`)}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Chip label={t('lobby.rulesButton')} leading={IconName.Info} onPress={onRules} />
          </View>
        </View>
      </View>
    </Section>
  );
}
