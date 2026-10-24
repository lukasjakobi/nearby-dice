import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconButton, IconName, Text, TextVariant, useTheme } from '@/ui';

import { OnboardingSlide } from '../hooks';

type OnboardingHeaderProps = {
  slide: OnboardingSlide;
  slides: OnboardingSlide[];
  canGoBack: boolean;
  canSkip: boolean;
  onBack: () => void;
  onSkip: () => void;
};

/** Top bar of the intro: back button, step dots and skip. */
export function OnboardingHeader({
  slide,
  slides,
  canGoBack,
  canSkip,
  onBack,
  onSkip,
}: OnboardingHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        paddingLeft: 8,
        paddingRight: 12,
        minHeight: 48,
      }}
    >
      <View style={{ width: 96 }}>
        {canGoBack ? (
          <IconButton icon={IconName.Back} label={t('common.back')} onPress={onBack} />
        ) : null}
      </View>
      <View
        style={{ flexDirection: 'row', gap: 8 }}
        accessible
        accessibilityLabel={t('onboarding.step', { n: slide + 1 })}
      >
        {slides.map((s) => (
          <View
            key={s}
            style={{
              width: s === slide ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: s === slide ? colors.primary : colors.line,
            }}
          />
        ))}
      </View>
      <View style={{ width: 96, alignItems: 'flex-end' }}>
        {canSkip ? (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Text variant={TextVariant.Label} size={15} color="muted">
              {t('onboarding.skip')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
