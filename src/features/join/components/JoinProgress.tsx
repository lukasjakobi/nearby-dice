import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { JoinStep } from '@/session';
import { Font, Icon, IconName, Spinner, Text, fontFamily, useTheme } from '@/ui';

const STEPS = [JoinStep.Search, JoinStep.Secure, JoinStep.Join];

enum StepState {
  Done = 'done',
  Active = 'active',
  Upcoming = 'upcoming',
}

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
      <View style={{ alignSelf: 'stretch', gap: 14 }} accessibilityLiveRegion="polite">
        {STEPS.map((s, i) => {
          const state = stateOf(i);

          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: state === StepState.Upcoming ? colors.line : colors.primary,
                  backgroundColor: state === StepState.Done ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {state === StepState.Done ? (
                  <Icon
                    name={IconName.Check}
                    color={colors.onPrimary}
                    size={16}
                    strokeWidth={3.2}
                  />
                ) : null}
                {state === StepState.Active ? (
                  <Spinner color={colors.primary} size={14} strokeWidth={3.2} />
                ) : null}
              </View>
              <Text
                size={16}
                weight={state === StepState.Active ? 600 : 500}
                color={state === StepState.Upcoming ? 'muted' : 'ink'}
              >
                {t(`labels.joinStep.${s}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
