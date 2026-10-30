import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { NearbyPermissionCard } from './NearbyPermissionCard';

const meta: Meta<typeof NearbyPermissionCard> = {
  title: 'Features/Settings/NearbyPermissionCard',
  component: NearbyPermissionCard,
  args: { granted: true, onOpenSettings: fn() },
};

export default meta;
type Story = StoryObj<typeof NearbyPermissionCard>;

export const Allowed: Story = {};

export const NotAllowed: Story = { args: { granted: false } };
