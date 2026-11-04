import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { ROUND_CODE_LENGTH } from '@/net';
import { FIXED, Font, RADIUS, Text, fontFamily, useTheme } from '@/ui';

import { Caret } from './Caret';

/** Typed characters land tipped, like the code's dice in the lobby. */
const TILTS = [-4, 3, -2, 4];

/**
 * Four large boxes driven by one hidden text field underneath (auto-uppercase,
 * paste fills all four). They are blank dice on a green card, as the code shows in the lobby; the
 * active one has an accent ring and a caret.
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
    <View
      style={{
        backgroundColor: colors.primary,
        borderRadius: RADIUS.dialog,
        paddingVertical: 18,
        paddingHorizontal: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }} accessible={false}>
        {Array.from({ length: ROUND_CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={{
              width: 66,
              height: 80,
              borderRadius: 18,
              borderWidth: 3,
              borderBottomWidth: 6,
              // The die being typed on glows in the accent; the rest wait blank.
              borderColor: i === active ? colors.accent : FIXED.dieEdge,
              backgroundColor: FIXED.dieFace,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: value[i] ? `${TILTS[i]}deg` : '0deg' }],
            }}
          >
            {value[i] ? (
              <Text
                size={46}
                color={{ raw: FIXED.diePip }}
                style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 54 }}
              >
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
