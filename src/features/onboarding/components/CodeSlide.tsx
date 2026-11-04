import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PlayerColor } from '@/domain';
import { Font, fontFamily, Icon, IconName, PLAYER_COLOR_HEX, Text, useTheme } from '@/ui';
import { RoundCodeBoxes } from '@/shared';

import { RoleBadge } from './RoleBadge';
import { SlideText } from './SlideText';

const DEMO_CODE = '7K4M';
/** Who shows the code and who types it: the host's card, a guest's field. */
const HOST = { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] };
const GUEST = { initial: 'A', color: PLAYER_COLOR_HEX[PlayerColor.Sky] };

export function CodeSlide() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 36 }}>
      <View style={{ alignItems: 'center', gap: 16 }} accessible={false}>
        <View
          style={{
            alignSelf: 'stretch',
            backgroundColor: colors.primary,
            borderRadius: 28,
            paddingVertical: 20,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text size={12} weight={600} color="onPrimary" style={{ letterSpacing: 1.5 }}>
            {t('onboarding.roundCode').toUpperCase()}
          </Text>
          <RoundCodeBoxes code={DEMO_CODE} boxWidth={56} />
          <RoleBadge {...HOST} />
        </View>
        <Icon name={IconName.ArrowDown} color={colors.muted} size={28} />
        <View
          style={{
            alignSelf: 'stretch',
            height: 80,
            borderRadius: 20,
            borderWidth: 2.5,
            borderColor: colors.primary,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {[...DEMO_CODE].map((char, i) => (
            <Text
              key={i}
              size={44}
              align="center"
              style={{ width: 44, fontFamily: fontFamily(Font.Display, 700), lineHeight: 52 }}
            >
              {char}
            </Text>
          ))}
          <RoleBadge {...GUEST} />
        </View>
      </View>
      <SlideText
        title={t('onboarding.slides.code.title')}
        body={t('onboarding.slides.code.body')}
      />
    </View>
  );
}
