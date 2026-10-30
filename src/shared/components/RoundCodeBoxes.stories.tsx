import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { useTheme } from '@/ui';

import { RoundCodeBoxes } from './RoundCodeBoxes';

const meta: Meta<typeof RoundCodeBoxes> = {
  title: 'Shared/Lobby/RoundCodeBoxes',
  component: RoundCodeBoxes,
  args: { code: '7K4M', boxWidth: 62 },
  decorators: [
    function OnPrimary(Story) {
      const { colors } = useTheme();

      return (
        <View
          style={{
            alignItems: 'center',
            padding: 20,
            borderRadius: 24,
            backgroundColor: colors.primary,
          }}
        >
          <Story />
        </View>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof RoundCodeBoxes>;

export const Lobby: Story = {};

/** The smaller demo in onboarding. */
export const Small: Story = { args: { boxWidth: 56 } };
