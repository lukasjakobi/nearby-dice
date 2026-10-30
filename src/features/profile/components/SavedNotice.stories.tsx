import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { SavedNotice } from './SavedNotice';

const meta: Meta<typeof SavedNotice> = {
  title: 'Features/Profile/SavedNotice',
  component: SavedNotice,
};

export default meta;

export const Default: StoryObj<typeof SavedNotice> = {};
