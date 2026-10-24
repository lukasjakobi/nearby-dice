import { Pressable, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Spinner } from './Spinner';
import { Text } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS, SIZE } from './theme/tokens';
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
  /** The roll button on the felt. */
  Accent = 'accent',
  /** Small action inside the amber banner: "Optionen". */
  OnAccent = 'on-accent',
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
  [ButtonVariant.Accent]: (c) => ({ background: c.accent, text: c.onAccent }),
  [ButtonVariant.OnAccent]: (c) => ({ background: c.onAccent, text: c.accent }),
};

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
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
  disabled = false,
  loading = false,
  alignStart = false,
  height = SIZE.buttonHeight,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const look = LOOKS[variant](colors);
  const inactive = disabled || loading;

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
          borderRadius: RADIUS.button,
          paddingHorizontal: 20,
          backgroundColor: look.background,
          borderWidth: look.border ? 1.5 : 0,
          borderColor: look.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: alignStart ? 'flex-start' : 'center',
          gap: 8,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !inactive ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <Spinner color={look.text} size={22} /> : null}
      <View style={{ flexShrink: 1 }}>
        <Text variant={TextVariant.BodyStrong} color={{ raw: look.text }} align="center">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
