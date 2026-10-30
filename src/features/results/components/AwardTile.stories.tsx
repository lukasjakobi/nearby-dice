import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';

import { AwardTile } from './AwardTile';
import { finished } from './fixtures';

const meta: Meta<typeof AwardTile> = {
  title: 'Features/Results/AwardTile',
  component: AwardTile,
  decorators: [
    (Story) => (
      <View style={{ flexDirection: 'row', width: 120 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

/** The highest single entry of the game, with who scored it. */
export const BestMove: StoryObj<typeof AwardTile> = {
  render: () => <AwardTile award={finished(i18n.t).awards[0]} />,
};
