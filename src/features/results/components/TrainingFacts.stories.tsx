import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { TrainingFacts } from './TrainingFacts';

const meta: Meta<typeof TrainingFacts> = {
  title: 'Features/Results/TrainingFacts',
  component: TrainingFacts,
};

export default meta;

export const Default: StoryObj<typeof TrainingFacts> = {
  render: () => (
    <TrainingFacts
      facts={[
        { label: i18n.t('results.training.best'), value: 241 },
        { label: i18n.t('results.training.yatzys'), value: 1 },
      ]}
    />
  ),
};
