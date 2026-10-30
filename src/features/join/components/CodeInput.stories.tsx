import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { normalizeRoundCode } from '@/net';

import { CodeInput } from './CodeInput';

const meta: Meta<typeof CodeInput> = {
  title: 'Features/Join/CodeInput',
  component: CodeInput,
  args: { value: '', onChange: fn() },
  // Typing fills the boxes, normalised as the join flow does it.
  render: function ControlledCode(args) {
    const [value, setValue] = useState(args.value);

    return (
      <CodeInput
        value={value}
        onChange={(next) => {
          setValue(normalizeRoundCode(next));
          args.onChange(next);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof CodeInput>;

export const Empty: Story = {};

export const Partial: Story = { args: { value: '7K' } };

export const Complete: Story = { args: { value: '7K4M' } };
