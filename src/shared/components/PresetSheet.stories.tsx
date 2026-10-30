import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PRESET_ORDER, PresetId } from '@/domain';

import { PresetSheet } from './PresetSheet';

const meta: Meta<typeof PresetSheet> = {
  title: 'Shared/Presets/PresetSheet',
  component: PresetSheet,
  parameters: { screen: true },
  args: { visible: true, value: PresetId.Blitz, onChange: fn(), onClose: fn() },
  argTypes: { value: { control: 'select', options: PRESET_ORDER } },
};

export default meta;

export const Default: StoryObj<typeof PresetSheet> = {};
