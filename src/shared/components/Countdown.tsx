import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import type { TFunction } from '@/i18n';
import { Font, Pop, Text, TextVariant, fontFamily, useTheme } from '@/ui';

import { useNow } from '../hooks/useNow';
import { useFeedback } from '../hooks/useFeedback';

/** "3, 2, 1, Los!" from the time left. */
export function countdownLabel(t: TFunction, msLeft: number): string {
  if (msLeft > 2600) return '3';
  if (msLeft > 1700) return '2';
  if (msLeft > 800) return '1';

  return t('lobby.go');
}

/** Full-screen countdown on primary: "Das Spiel beginnt" over a huge number. */
export function Countdown({ endsAt }: { endsAt: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const now = useNow(100);
  const label = countdownLabel(t, endsAt - now);
  const feedback = useFeedback();
  const sounded = useRef('');
  useEffect(() => {
    const key = `${endsAt}:${label}`;
    if (sounded.current === key || endsAt <= Date.now()) return;
    sounded.current = key;
    if (label === t('lobby.go')) feedback.start();
    else feedback.countdown();
  }, [endsAt, label, feedback, t]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: 24,
      }}
    >
      <Text variant={TextVariant.ScreenTitle} color="onPrimary">
        {t('lobby.countdownTitle')}
      </Text>
      <Pop key={label}>
        <Text
          color="onPrimary"
          size={150}
          accessibilityLiveRegion="assertive"
          style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 160 }}
        >
          {label}
        </Text>
      </Pop>
    </View>
  );
}
