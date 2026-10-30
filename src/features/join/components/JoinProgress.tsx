import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { JoinStep } from '@/session';
import { Font, StepList, StepState, Text, fontFamily, useTheme } from '@/ui';

const STEPS = [JoinStep.Search, JoinStep.Secure, JoinStep.Join];

/** The code in a pulsing tile and the three join steps with their progress. */
export function JoinProgress({ code, step }: { code: string; step: JoinStep }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const current = STEPS.indexOf(step);
  const stateOf = (i: number) =>
    i < current ? StepState.Done : i === current ? StepState.Active : StepState.Upcoming;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 3,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            color="onPrimary"
            size={30}
            style={{ fontFamily: fontFamily(Font.Display, 700), letterSpacing: 2 }}
          >
            {code}
          </Text>
        </View>
      </View>
      <StepList
        steps={STEPS.map((s, i) => ({
          key: s,
          label: t(`labels.joinStep.${s}`),
          state: stateOf(i),
        }))}
      />
    </View>
  );
}
