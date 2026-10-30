import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'UI/Inputs/TextField',
  component: TextField,
  args: {
    label: 'Dein Name',
    value: 'Lukas',
    maxLength: 16,
    placeholder: 'Name',
    onChangeText: fn(),
  },
  // Typing updates the field, as in the app; the action log still records every change.
  render: function ControlledField(args) {
    const [value, setValue] = useState(args.value);

    return (
      <TextField
        {...args}
        value={value}
        onChangeText={(next) => {
          setValue(next);
          args.onChangeText(next);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Filled: Story = {};

export const Empty: Story = { args: { value: '' } };

export const WithCounter: Story = {
  args: { label: 'Name der Runde', value: 'Lukas’ Runde', maxLength: 24, showCounter: true },
};

export const WithHelp: Story = { args: { help: 'So sehen dich die anderen am Tisch.' } };

export const WithError: Story = { args: { value: '', error: 'Bitte einen Namen eingeben.' } };
