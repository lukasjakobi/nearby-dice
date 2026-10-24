import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Bob, DieFace } from '@/ui';
import { FeltTray } from '@/shared';

import { SlideText } from './SlideText';

const DICE_ROWS = [
  [
    { tilt: -6, delay: 0 },
    { tilt: 4, delay: 300 },
    { tilt: -3, delay: 600 },
  ],
  [
    { tilt: 5, delay: 900 },
    { tilt: -4, delay: 1200 },
  ],
];

export function DiceSlide() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 36 }}>
      <FeltTray style={{ borderRadius: 32, paddingVertical: 36, alignItems: 'center', gap: 26 }}>
        {DICE_ROWS.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 10 }} accessible={false}>
            {row.map((die, i) => (
              <Bob key={i} tilt={die.tilt} delayMs={die.delay}>
                <DieFace value={5} size={52} />
              </Bob>
            ))}
          </View>
        ))}
      </FeltTray>
      <SlideText
        title={t('onboarding.slides.dice.title')}
        body={t('onboarding.slides.dice.body')}
      />
    </View>
  );
}
