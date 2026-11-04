import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { ROUND_CODE_LENGTH } from '@/net';
import { Font, RADIUS, Text, fontFamily, useTheme } from '@/ui';

import { Caret } from './Caret';

/** Typed characters land tipped, like the code's dice in the lobby. */
const TILTS = [-4, 3, -2, 4];

/**
 * Four large boxes driven by one hidden text field underneath (auto-uppercase,
 * paste fills all four). The active character gets a stronger outline and a caret.
 */
export function CodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, ROUND_CODE_LENGTH - 1);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: RADIUS.dialog,
        paddingVertical: 18,
        paddingHorizontal: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessible={false}>
        {Array.from({ length: ROUND_CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              maxWidth: 66,
              height: 80,
              borderRadius: 18,
              borderWidth: 3,
              borderBottomWidth: 6,
              borderColor: i === active && focused ? colors.ink : colors.control,
              backgroundColor: colors.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: value[i] ? `${TILTS[i]}deg` : '0deg' }],
            }}
          >
            {value[i] ? (
              <Text
                size={46}
                color="ink"
                style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 54 }}
              >
                {value[i]}
              </Text>
            ) : i === value.length && focused ? (
              <Caret />
            ) : null}
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        maxLength={ROUND_CODE_LENGTH + 4}
        caretHidden
        accessibilityLabel={t('join.codeLabel')}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          color: 'transparent',
          fontSize: 16,
        }}
      />
    </View>
  );
}
