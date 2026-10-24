import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { MAX_PLAYERS, MIN_PLAYERS } from '@/domain';
import { RADIUS, Text, TextVariant, useTheme } from '@/ui';

const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i,
);

type PlayerCountChoiceProps = { value: number; onChange: (value: number) => void };

/** "Spieler (max.)": one button per allowed player count. */
export function PlayerCountChoice({ value, onChange }: PlayerCountChoiceProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('hostSetup.maxPlayersLabel')}
      style={{ flexDirection: 'row', gap: 8 }}
    >
      {PLAYER_COUNTS.map((n) => {
        const selected = n === value;

        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: RADIUS.button,
              borderWidth: 2,
              borderColor: selected ? colors.primary : colors.line,
              backgroundColor: selected ? colors.primary : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant={TextVariant.SectionTitle}
              size={22}
              color={selected ? 'onPrimary' : 'ink'}
            >
              {String(n)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
