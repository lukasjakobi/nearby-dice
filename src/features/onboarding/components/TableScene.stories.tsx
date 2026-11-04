import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { TableScene } from './TableScene';

const meta: Meta<typeof TableScene> = {
  title: 'Features/Onboarding/TableScene',
  component: TableScene,
};

export default meta;

/** Four friends around the felt, each with their phone. */
export const Default: StoryObj<typeof TableScene> = {};
