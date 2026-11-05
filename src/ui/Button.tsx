import { Pressable, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Icon } from './icons/Icon';
import type { IconName } from './icons/Icon';
import { Spinner } from './Spinner';
import { Text } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { EDGE, FIXED, RADIUS, SIZE, alpha, shade } from './theme/tokens';
import type { Palette } from './theme/tokens';
import { TextVariant } from './theme/typography';

export enum ButtonVariant {
  Primary = 'primary',
  /** Outlined, transparent: "Abbrechen", "Zurück", "Verwerfen". */
  Secondary = 'secondary',
  /** Destructive confirm in dialogs. */
  Danger = 'danger',
  /** Outlined with red text: "Profil zurücksetzen". */
  DangerOutline = 'danger-outline',
  /** Filled with surface2: menu rows. */
  Tonal = 'tonal',
  /** Tonal with red text: "Aus der Lobby entfernen". */
  TonalDanger = 'tonal-danger',
  /** Raised ivory tile for rolling dice. */
  Roll = 'roll',
  /** Score confirmation on the felt. */
  Accent = 'accent',
  /** Small action inside the amber banner: "Optionen". */
  OnAccent = 'on-accent',
  /** Text only, for a way out that should not compete: "Später", "Runde beenden". */
  Quiet = 'quiet',
  /** Text only in red, for a destructive action kept apart from the main one. */
  QuietDanger = 'quiet-danger',
}

type Look = { background: string; text: string; border?: string };

const LOOKS: Record<ButtonVariant, (c: Palette) => Look> = {
  [ButtonVariant.Primary]: (c) => ({ background: c.primary, text: c.onPrimary }),
  [ButtonVariant.Secondary]: (c) => ({ background: 'transparent', text: c.ink, border: c.line }),
  [ButtonVariant.Danger]: (c) => ({ background: c.danger, text: c.onDanger }),
  [ButtonVariant.DangerOutline]: (c) => ({
    background: 'transparent',
    text: c.danger,
    border: c.line,
  }),
  [ButtonVariant.Tonal]: (c) => ({ background: c.surface2, text: c.ink }),
  [ButtonVariant.TonalDanger]: (c) => ({ background: c.surface2, text: c.danger }),
  [ButtonVariant.Roll]: (c) => ({ background: c.roll, text: c.onRoll }),
  [ButtonVariant.Accent]: (c) => ({ background: c.accent, text: c.onAccent }),
  [ButtonVariant.OnAccent]: (c) => ({ background: c.onAccent, text: c.accent }),
  [ButtonVariant.Quiet]: (c) => ({ background: 'transparent', text: c.muted }),
  [ButtonVariant.QuietDanger]: (c) => ({ background: 'transparent', text: c.danger }),
};

/** Disabled buttons turn flat grey with readable text instead of fading out. */
const DISABLED: (c: Palette) => Look = (c) => ({ background: c.surface2, text: c.muted });

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Before the label: the dice on the roll button. */
  icon?: IconName;
  disabled?: boolean;
  /** Shows a spinner next to the label and disables the button. */
  loading?: boolean;
  /** Left-aligned label (menu rows). */
  alignStart?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = ButtonVariant.Primary,
  icon,
  disabled = false,
  loading = false,
  alignStart = false,
  height = SIZE.buttonHeight,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const look = (disabled && !loading ? DISABLED : LOOKS[variant])(colors);
  const inactive = disabled || loading;
  const rollTile = variant === ButtonVariant.Roll;
  const edgeWidth = rollTile ? 5 : EDGE;
  // Filled and outlined buttons stand on a darker edge and sink into it when pressed; quiet ones
  // and disabled ones lie flat.
  const edge = inactive
    ? null
    : look.background.startsWith('#')
      ? shade(look.background, rollTile ? 0.35 : 0.28)
      : (look.border ?? null);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        {
          minHeight: height,
          borderRadius: rollTile ? RADIUS.rollTile : RADIUS.button,
          paddingHorizontal: 20,
          backgroundColor: look.background,
          borderWidth: look.border ? 1.5 : 0,
          borderColor: look.border,
          borderBottomWidth: edge ? (pressed ? 1.5 : edgeWidth) : look.border ? 1.5 : 0,
          borderBottomColor: edge ?? look.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: alignStart ? 'flex-start' : 'center',
          gap: 8,
          opacity: pressed && !edge && !inactive ? 0.7 : 1,
          boxShadow:
            rollTile && !inactive && !pressed
              ? [{ offsetX: 0, offsetY: 5, blurRadius: 10, color: alpha(FIXED.shadow, 0.2) }]
              : undefined,
          transform: [{ translateY: pressed && edge ? edgeWidth - 1.5 : 0 }],
        },
        style,
      ]}
    >
      {loading ? (
        <Spinner color={look.text} size={22} />
      ) : icon ? (
        <Icon name={icon} color={look.text} size={22} strokeWidth={2.2} />
      ) : null}
      <View style={{ flexShrink: 1 }}>
        <Text variant={TextVariant.BodyStrong} color={{ raw: look.text }} align="center">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
