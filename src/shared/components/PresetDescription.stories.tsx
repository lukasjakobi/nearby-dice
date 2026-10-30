import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PRESET_ORDER, PresetId } from '@/domain';

import { PresetDescription } from './PresetDescription';

const meta: Meta<typeof PresetDescription> = {
  title: 'Shared/Presets/PresetDescription',
  component: PresetDescription,
  args: { preset: PresetId.Classic },
  argTypes: { preset: { control: 'select', options: PRESET_ORDER } },
};

export default meta;

export const Default: StoryObj<typeof PresetDescription> = {};
