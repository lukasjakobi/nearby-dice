import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { AwardTiles } from './AwardTiles';
import { finished } from './fixtures';

const meta: Meta<typeof AwardTiles> = {
  title: 'Features/Results/AwardTiles',
  component: AwardTiles,
};

export default meta;

/** Highest entry, upper bonus and most zeros side by side. */
export const Default: StoryObj<typeof AwardTiles> = {
  render: () => <AwardTiles awards={finished(i18n.t).awards} />,
};
