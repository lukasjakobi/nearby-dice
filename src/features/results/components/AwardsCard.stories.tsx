import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { AwardsCard } from './AwardsCard';
import { finished } from './fixtures';

const meta: Meta<typeof AwardsCard> = {
  title: 'Features/Results/AwardsCard',
  component: AwardsCard,
};

export default meta;

/** Highest entry, upper bonus, most zeros: with who earned each. */
export const Default: StoryObj<typeof AwardsCard> = {
  render: () => <AwardsCard awards={finished(i18n.t).awards} />,
};
