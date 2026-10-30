import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { NewPlayerCard } from './NewPlayerCard';

const meta: Meta<typeof NewPlayerCard> = {
  title: 'Features/Home/NewPlayerCard',
  component: NewPlayerCard,
  args: { onCreate: fn() },
};

export default meta;

export const Default: StoryObj<typeof NewPlayerCard> = {};
