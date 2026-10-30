import { View } from 'react-native';

import { Icon, IconName } from './icons/Icon';
import { Spinner } from './Spinner';
import { Text } from './Text';
import { useTheme } from './theme/ThemeProvider';

export enum StepState {
  Done = 'done',
  Active = 'active',
  Upcoming = 'upcoming',
}

export type Step = { key: string; label: string; state: StepState };

/** Steps of a process one below the other: a tick when done, a spinner while running. */
export function StepList({ steps }: { steps: Step[] }) {
  const { colors } = useTheme();

  return (
    <View style={{ alignSelf: 'stretch', gap: 14 }} accessibilityLiveRegion="polite">
      {steps.map((step) => (
        <View key={step.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: step.state === StepState.Upcoming ? colors.line : colors.primary,
              backgroundColor: step.state === StepState.Done ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {step.state === StepState.Done ? (
              <Icon name={IconName.Check} color={colors.onPrimary} size={16} strokeWidth={3.2} />
            ) : null}
            {step.state === StepState.Active ? (
              <Spinner color={colors.primary} size={14} strokeWidth={3.2} />
            ) : null}
          </View>
          <Text
            size={16}
            weight={step.state === StepState.Active ? 600 : 500}
            color={step.state === StepState.Upcoming ? 'muted' : 'ink'}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
