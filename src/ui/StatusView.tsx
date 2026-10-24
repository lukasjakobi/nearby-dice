import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from './icons/Icon';
import type { IconName } from './icons/Icon';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import type { Palette } from './theme/tokens';

export enum StatusTone {
  Neutral = 'neutral',
  Danger = 'danger',
  Success = 'success',
}

type ToneLook = { ring: string; fill: string; icon: string };

const TONES: Record<StatusTone, (c: Palette) => ToneLook> = {
  [StatusTone.Neutral]: (c) => ({ ring: c.line, fill: c.surface, icon: c.primary }),
  [StatusTone.Danger]: (c) => ({ ring: c.danger, fill: c.surface, icon: c.danger }),
  [StatusTone.Success]: (c) => ({ ring: c.ok, fill: c.ok, icon: c.surface }),
};

type StatusViewProps = {
  icon: IconName;
  title: string;
  body?: string;
  tone?: StatusTone;
  /** Buttons pinned to the bottom. */
  actions?: ReactNode;
  /** Announce as an alert (errors). */
  alert?: boolean;
};

/** Centered icon circle, title and body: permission, error, success and end states. */
export function StatusView({
  icon,
  title,
  body,
  tone = StatusTone.Neutral,
  actions,
  alert = false,
}: StatusViewProps) {
  const { colors } = useTheme();
  const look = TONES[tone](colors);

  return (
    <View style={{ flex: 1, gap: 20 }}>
      <View
        accessibilityRole={alert ? 'alert' : undefined}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          paddingHorizontal: 8,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: look.fill,
            borderWidth: 1.5,
            borderColor: look.ring,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={icon}
            color={look.icon}
            size={44}
            strokeWidth={tone === StatusTone.Success ? 2.6 : 1.9}
          />
        </View>
        <Text variant={TextVariant.ScreenTitle} align="center">
          {title}
        </Text>
        {body ? (
          <Text color="muted" align="center" style={{ maxWidth: 300 }}>
            {body}
          </Text>
        ) : null}
      </View>
      {actions ? <View style={{ gap: 10 }}>{actions}</View> : null}
    </View>
  );
}
