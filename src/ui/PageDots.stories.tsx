import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PageDots } from './PageDots';

const meta: Meta<typeof PageDots> = {
  title: 'UI/Display/PageDots',
  component: PageDots,
  args: { count: 3, current: 0, label: 'Schritt 1 von 3' },
  argTypes: { current: { control: { type: 'range', min: 0, max: 2, step: 1 } } },
};

export default meta;
type Story = StoryObj<typeof PageDots>;

export const First: Story = {};

export const Last: Story = { args: { current: 2, label: 'Schritt 3 von 3' } };
