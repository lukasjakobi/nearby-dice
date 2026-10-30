import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Spinner } from './Spinner';
import { PALETTES } from './theme/tokens';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Display/Spinner',
  component: Spinner,
  args: { color: PALETTES.light.primary, size: 44, strokeWidth: 2.2, label: 'Lädt' },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

/** Inline next to text, as in the lobby rows. */
export const Small: Story = { args: { size: 14, strokeWidth: 3 } };
