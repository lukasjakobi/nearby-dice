import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Category } from '@/domain';

import { ScoreboardRow } from './ScoreboardRow';

const meta: Meta<typeof ScoreboardRow> = {
  title: 'Features/Game/Scoreboard/ScoreboardRow',
  component: ScoreboardRow,
  decorators: [
    (Story) => (
      <View style={{ width: 320 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScoreboardRow>;

export const Filled: Story = {
  args: {
    row: {
      key: Category.Fives,
      category: Category.Fives,
      face: 5,
      label: 'Fünfer',
      value: '15',
    },
  },
};

export const Open: Story = {
  args: {
    row: {
      key: Category.LargeStraight,
      category: Category.LargeStraight,
      face: null,
      label: 'Große Straße',
      value: '–',
    },
  },
};

/** A row without a field, like the Yatzy bonus: the icon column stays empty. */
export const Bonus: Story = {
  args: {
    row: { key: 'yatzy-bonus', category: null, face: null, label: 'Yatzy-Bonus', value: '100' },
  },
};
