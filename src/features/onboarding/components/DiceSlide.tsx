import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SlideText } from './SlideText';
import { TableScene } from './TableScene';

export function DiceSlide() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 40 }}>
      <TableScene />
      <SlideText
        title={t('onboarding.slides.dice.title')}
        body={t('onboarding.slides.dice.body')}
      />
    </View>
  );
}
