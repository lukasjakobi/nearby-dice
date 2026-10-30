import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';

import { Icon, IconName } from './icons/Icon';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { MAX_FONT_SCALE, Font, fontFamily } from './theme/typography';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  /** Shown in red below the input; replaces `help`. */
  error?: string | null;
  help?: string;
  /** "n/16" on the right of the help line. */
  showCounter?: boolean;
};

/**
 * A card holding the label, the value in large display type and a pencil icon.
 * Tapping anywhere on the card focuses the input.
 */
export function TextField({
  label,
  value,
  onChangeText,
  maxLength,
  placeholder,
  error,
  help,
  showCounter = false,
}: TextFieldProps) {
  const { colors } = useTheme();
  const input = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  const message = error ?? help;
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.line;

  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor,
        borderRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 10,
        gap: 2,
      }}
    >
      <Text variant={TextVariant.Label} size={13} color="muted">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          autoComplete="off"
          accessibilityLabel={label}
          accessibilityHint={message ?? undefined}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            padding: 0,
            color: colors.ink,
            fontSize: 26,
            fontFamily: fontFamily(Font.Display, 600),
          }}
        />
        <Icon name={IconName.Pencil} color={colors.muted} size={20} strokeWidth={2} />
      </View>
      {message || showCounter ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text
            variant={TextVariant.Caption}
            color={error ? 'danger' : 'muted'}
            accessibilityLiveRegion="polite"
            accessibilityRole={error ? 'alert' : undefined}
            style={{ flex: 1 }}
          >
            {message ?? ''}
          </Text>
          {showCounter ? (
            <Text variant={TextVariant.Caption} color="muted">
              {`${value.length}/${maxLength}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
