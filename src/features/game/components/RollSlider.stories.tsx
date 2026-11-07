import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { useTheme } from '@/ui';

import { RollSlider } from './RollSlider';

const meta: Meta<typeof RollSlider> = {
  title: 'Features/Game/RollSlider',
  component: RollSlider,
  args: { label: 'Würfeln', onRoll: fn() },
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

/** Slide the knob to the far end to roll; a tap or a short slide springs back. */
export const Ready: StoryObj<typeof RollSlider> = {};
