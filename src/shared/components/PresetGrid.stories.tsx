import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { PRESET_ORDER, PresetId, TRAINING_PRESET_ORDER } from '@/domain';

import { PresetGrid } from './PresetGrid';

const meta: Meta<typeof PresetGrid> = {
  title: 'Shared/Presets/PresetGrid',
  component: PresetGrid,
  args: { value: PresetId.Classic, onChange: fn(), onRules: fn() },
  argTypes: { value: { control: 'select', options: PRESET_ORDER } },
  render: function ControlledGrid(args) {
    const [value, setValue] = useState(args.value);

    return (
      <PresetGrid
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof PresetGrid>;

/** "Spielstil" in the host setup: two full rows. */
export const AllPresets: Story = {};

/** Training leaves out "Gleiche Würfel"; the short last row keeps its tiles at the same width. */
export const Training: Story = { args: { presets: TRAINING_PRESET_ORDER } };
