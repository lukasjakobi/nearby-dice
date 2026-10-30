import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { TrainingTile } from './TrainingTile';

const meta: Meta<typeof TrainingTile> = {
  title: 'Features/Home/TrainingTile',
  component: TrainingTile,
  args: { onPress: fn() },
};

export default meta;
type Story = StoryObj<typeof TrainingTile>;

export const FirstTime: Story = {
  render: (args) => <TrainingTile {...args} hint={i18n.t('home.trainingHint')} />,
};

export const WithBest: Story = {
  render: (args) => (
    <TrainingTile {...args} hint={i18n.t('home.trainingHintBest', { best: 241 })} />
  ),
};
