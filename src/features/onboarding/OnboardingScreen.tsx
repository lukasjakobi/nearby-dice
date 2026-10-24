import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Screen } from '@/ui';

import { CodeSlide, DiceSlide, OnboardingHeader, ProfileSlide } from './components';
import { OnboardingSlide, useOnboarding } from './hooks';

const SLIDES = [OnboardingSlide.Dice, OnboardingSlide.Code, OnboardingSlide.Profile];

export function OnboardingScreen() {
  const { t } = useTranslation();
  const onboarding = useOnboarding();
  const { slide } = onboarding;

  return (
    <Screen keyboardAvoiding>
      <OnboardingHeader
        slide={slide}
        slides={SLIDES}
        canGoBack={onboarding.canGoBack}
        canSkip={onboarding.canSkip}
        onBack={onboarding.back}
        onSkip={onboarding.skip}
      />

      <ScrollView
        key={slide}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {
          {
            [OnboardingSlide.Dice]: <DiceSlide />,
            [OnboardingSlide.Code]: <CodeSlide />,
            [OnboardingSlide.Profile]: <ProfileSlide form={onboarding.form} />,
          }[slide]
        }
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}>
        {onboarding.isLast ? (
          <Button
            label={t('onboarding.finish')}
            onPress={onboarding.finish}
            disabled={!onboarding.form.valid}
          />
        ) : (
          <Button label={t('onboarding.next')} onPress={onboarding.next} />
        )}
      </View>
    </Screen>
  );
}
