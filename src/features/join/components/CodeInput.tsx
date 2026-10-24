import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { ROUND_CODE_LENGTH } from '@/net';
import { Font, Text, fontFamily, useTheme } from '@/ui';

import { Caret } from './Caret';

/**
 * Four large boxes driven by one hidden text field underneath (auto-uppercase,
 * paste fills all four). The active box has a primary border and a caret.
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
  const active = Math.min(value.length, ROUND_CODE_LENGTH - 1);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }} accessible={false}>
        {Array.from({ length: ROUND_CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={{
              width: 72,
              height: 92,
              borderRadius: 20,
              borderWidth: 2.5,
              borderColor: i === active ? colors.primary : colors.line,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {value[i] ? (
              <Text size={46} style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 54 }}>
                {value[i]}
              </Text>
            ) : i === value.length ? (
              <Caret />
            ) : null}
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
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
