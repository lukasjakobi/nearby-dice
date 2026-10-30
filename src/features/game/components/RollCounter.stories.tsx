import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';
import { useTheme } from '@/ui';

import { RollCounter } from './RollCounter';

const rolls = (rollsLeft: number) => ({
  rollsText: i18n.t('game.rollsLeft', { count: rollsLeft }),
  rollsLabel: i18n.t('game.rollsLeft', { count: rollsLeft }),
  rollsLeft,
  rollsTotal: 3,
});

const meta: Meta<typeof RollCounter> = {
  title: 'Features/Game/RollCounter',
  component: RollCounter,
  decorators: [
    function OnFelt(Story) {
      const { colors } = useTheme();

      return (
        <View
          style={{
            alignSelf: 'flex-start',
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.felt,
          }}
        >
          <Story />
        </View>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof RollCounter>;

export const ThreeLeft: Story = { render: () => <RollCounter rolls={rolls(3)} /> };

export const OneLeft: Story = { render: () => <RollCounter rolls={rolls(1)} /> };

export const NoneLeft: Story = { render: () => <RollCounter rolls={rolls(0)} /> };
