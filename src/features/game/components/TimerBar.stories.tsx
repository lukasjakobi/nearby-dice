import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/ui';

import { TimerBar } from './TimerBar';

const LIMIT_MS = 30_000;
const LOW_MS = 10_000;

const meta: Meta<typeof TimerBar> = {
  title: 'Features/Game/TimerBar',
  component: TimerBar,
  decorators: [
    function OnFelt(Story) {
      const { colors } = useTheme();

      return (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.felt }}>
          <Story />
        </View>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof TimerBar>;

/** The deadline is a clock time: tap the bar to start the turn over. */
function Turn({ leftMs }: { leftMs: number }) {
  const [deadline, setDeadline] = useState(() => Date.now() + leftMs);

  return (
    <Pressable accessible={false} onPress={() => setDeadline(Date.now() + leftMs)}>
      <TimerBar deadline={deadline} limitMs={LIMIT_MS} lowMs={LOW_MS} />
    </Pressable>
  );
}

export const Running: Story = { render: () => <Turn leftMs={LIMIT_MS} /> };

/** The last ten seconds are red. */
export const RunningLow: Story = { render: () => <Turn leftMs={12_000} /> };
