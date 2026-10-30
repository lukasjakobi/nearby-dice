import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'UI/Inputs/Slider',
  component: Slider,
  args: { label: 'Töne', value: 0.6, step: 0.1, onChange: fn() },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.05 } } },
  render: function ControlledSlider(args) {
    const [value, setValue] = useState(args.value);

    return (
      <Slider
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
type Story = StoryObj<typeof Slider>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 1 } };
