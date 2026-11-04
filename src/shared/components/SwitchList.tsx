import { View } from 'react-native';

import { PlayerColor } from '@/domain';
import { VOLUME_STEP } from '@/store';
import {
  FIXED,
  IconBadge,
  IconName,
  ListGroup,
  ListRow,
  PLAYER_COLOR_HEX,
  Slider,
  Switch,
  Text,
  TextVariant,
} from '@/ui';

export type SwitchKey = 'sound' | 'music' | 'haptics' | 'keepAwake';

/** `volume` (0–1) adds a level slider below the switch while it is on. */
export type SwitchRow = { key: SwitchKey; label: string; value: boolean; volume?: number };

/** Each switch's badge: an icon on one of the player colours, so the list reads at a glance. */
const BADGES: Record<SwitchKey, { icon: IconName; color: PlayerColor }> = {
  sound: { icon: IconName.Sound, color: PlayerColor.Amber },
  music: { icon: IconName.Music, color: PlayerColor.Lilac },
  haptics: { icon: IconName.Vibrate, color: PlayerColor.Coral },
  keepAwake: { icon: IconName.Phone, color: PlayerColor.Sky },
};

/** One card with a badge and a switch per row, separated by hairlines. */
export function SwitchList({
  rows,
  onToggle,
  onVolume,
}: {
  rows: readonly SwitchRow[];
  onToggle: (key: SwitchKey) => void;
  onVolume?: (key: SwitchKey, value: number) => void;
}) {
  return (
    <ListGroup inset={62}>
      {rows.map((row) => (
        <ListRow
          key={row.key}
          title={row.label}
          leading={
            <IconBadge
              icon={BADGES[row.key].icon}
              color={PLAYER_COLOR_HEX[BADGES[row.key].color]}
              onColor={FIXED.onPlayer}
              solid
            />
          }
          trailing={
            <Switch value={row.value} onChange={() => onToggle(row.key)} label={row.label} />
          }
          below={
            row.value && row.volume !== undefined && onVolume ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: -8,
                  marginLeft: 46,
                }}
              >
                <View style={{ flex: 1 }}>
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
                  style={{ minWidth: 44 }}
                >
                  {`${Math.round(row.volume * 100)} %`}
                </Text>
              </View>
            ) : null
          }
        />
      ))}
    </ListGroup>
  );
}
