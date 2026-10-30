import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';

import { RankingPart } from './RankingPart';

const meta: Meta<typeof RankingPart> = {
  title: 'Features/Results/RankingPart',
  component: RankingPart,
  decorators: [
    (Story) => (
      <View style={{ flexDirection: 'row', width: 120 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof RankingPart> = {
  render: () => <RankingPart label={i18n.t('results.bonus')} value="+35" />,
};
