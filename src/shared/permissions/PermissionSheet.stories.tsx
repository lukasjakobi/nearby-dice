import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { RadioState } from '@/net';

import { PermissionSheet } from './PermissionSheet';

const meta: Meta<typeof PermissionSheet> = {
  title: 'Shared/Permissions/PermissionSheet',
  component: PermissionSheet,
  parameters: { screen: true },
  args: {
    state: { variant: 'primer' },
    busy: false,
    settingsError: false,
    onAction: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof PermissionSheet>;

/** Before the system prompt: why the app needs nearby devices. */
export const Primer: Story = {};

export const Asking: Story = { args: { busy: true } };

/** Denied for good: only the system settings help now. */
export const Blocked: Story = { args: { state: { variant: 'blocked' } } };

export const SettingsFailed: Story = {
  args: { state: { variant: 'blocked' }, settingsError: true },
};

export const Unavailable: Story = {
  args: { state: { variant: 'blocked', problem: 'unavailable' } },
};

export const CheckFailed: Story = { args: { state: { variant: 'blocked', problem: 'check' } } };

export const BluetoothOff: Story = {
  args: { state: { variant: 'radio', radio: RadioState.BluetoothOff } },
};

export const LocationOff: Story = {
  args: { state: { variant: 'radio', radio: RadioState.LocationOff } },
};
