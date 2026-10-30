import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Inputs/Switch',
  component: Switch,
  args: { label: 'Töne', value: true, onChange: fn() },
  render: function ControlledSwitch(args) {
    const [value, setValue] = useState(args.value);

    return (
      <Switch
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
type Story = StoryObj<typeof Switch>;

export const On: Story = {};

export const Off: Story = { args: { value: false } };
