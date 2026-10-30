import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PRESET_ORDER, PresetId } from '@/domain';

import { RulesSheet } from './RulesSheet';

const meta: Meta<typeof RulesSheet> = {
  title: 'Shared/Presets/RulesSheet',
  component: RulesSheet,
  parameters: { screen: true },
  args: { visible: true, preset: PresetId.Classic, onClose: fn() },
  argTypes: { preset: { control: 'select', options: PRESET_ORDER } },
};

export default meta;
type Story = StoryObj<typeof RulesSheet>;

export const Classic: Story = {};

export const Triple: Story = { args: { preset: PresetId.Triple } };
