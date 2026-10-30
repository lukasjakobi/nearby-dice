import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { PRESET_ORDER, PresetId } from '@/domain';

import { PresetDescription } from './PresetDescription';
import { PresetGrid } from './PresetGrid';

const meta: Meta<typeof PresetGrid> = {
  title: 'Shared/Presets/PresetGrid',
  component: PresetGrid,
  args: { value: PresetId.Classic, onChange: fn() },
  argTypes: { value: { control: 'select', options: PRESET_ORDER } },
  render: function ControlledGrid(args) {
    const [value, setValue] = useState(args.value);

    return (
      <View style={{ gap: 12 }}>
        <PresetGrid
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange(next);
          }}
        />
        <PresetDescription preset={value} />
      </View>
    );
  },
};

export default meta;
type Story = StoryObj<typeof PresetGrid>;

/** "Spielstil" in the host setup, with the description below as on that screen. */
export const AllPresets: Story = {};

/** An odd number of presets keeps the last tile half wide. */
export const Subset: Story = {
  args: { presets: [PresetId.Classic, PresetId.Blitz, PresetId.Triple] },
};
