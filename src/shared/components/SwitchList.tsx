import { View } from 'react-native';

import { VOLUME_STEP } from '@/store';
import { Card, Slider, Switch, Text, TextVariant, useTheme } from '@/ui';

export type SwitchKey = 'sound' | 'music' | 'haptics' | 'keepAwake';

/** `volume` (0–1) adds a level slider below the switch while it is on. */
export type SwitchRow = { key: SwitchKey; label: string; value: boolean; volume?: number };

/** One card with a switch per row, separated by hairlines. */
export function SwitchList({
  rows,
  onToggle,
  onVolume,
}: {
  rows: readonly SwitchRow[];
  onToggle: (key: SwitchKey) => void;
  onVolume?: (key: SwitchKey, value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <Card padding={0}>
      {rows.map((row, i) => (
        <View
          key={row.key}
          style={{
            paddingHorizontal: 14,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: colors.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 }}>
            <Text variant={TextVariant.Body} size={16} weight={500} style={{ flex: 1 }}>
              {row.label}
            </Text>
            <Switch value={row.value} onChange={() => onToggle(row.key)} label={row.label} />
          </View>
          {row.value && row.volume !== undefined && onVolume ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8 }}>
              <View style={{ flex: 1, marginLeft: -2 }}>
                <Slider
                  value={row.volume}
                  onChange={(value) => onVolume(row.key, value)}
                  label={row.label}
                  step={VOLUME_STEP}
                />
              </View>
              <Text
                variant={TextVariant.Body}
                size={14}
                color="muted"
                align="right"
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                style={{ minWidth: 48, marginRight: 2 }}
              >
                {`${Math.round(row.volume * 100)} %`}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </Card>
  );
}
