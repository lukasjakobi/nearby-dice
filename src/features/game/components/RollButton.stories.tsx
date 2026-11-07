import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { useTheme } from '@/ui';

import { RollButton } from './RollButton';

const meta: Meta<typeof RollButton> = {
  title: 'Features/Game/RollButton',
  component: RollButton,
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

/** The default roll control: a tap rolls. */
export const Ready: StoryObj<typeof RollButton> = {};
