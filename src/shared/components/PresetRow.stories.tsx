import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PRESET_ORDER, PresetId } from '@/domain';

import { PresetRow } from './PresetRow';

const meta: Meta<typeof PresetRow> = {
  title: 'Shared/Presets/PresetRow',
  component: PresetRow,
  args: { preset: PresetId.Classic },
  argTypes: { preset: { control: 'select', options: PRESET_ORDER } },
};

export default meta;
type Story = StoryObj<typeof PresetRow>;

/** A guest only sees the mode. */
export const ReadOnly: Story = {};

/** The host opens the preset sheet from here. */
export const Changeable: Story = { args: { onPress: fn() } };

/** Smaller and centred in the results footer. */
export const Centered: Story = { args: { onPress: fn(), centered: true } };
