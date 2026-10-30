import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Choice, ChoiceStyle } from './Choice';

const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

const meta: Meta<typeof Choice<string>> = {
  title: 'UI/Inputs/Choice',
  component: Choice,
  args: { label: 'Darstellung', options: THEMES, value: 'system', onChange: fn() },
  argTypes: { style: { control: 'inline-radio', options: Object.values(ChoiceStyle) } },
  render: function ControlledChoice(args) {
    const [value, setValue] = useState(args.value);

    return (
      <Choice
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
type Story = StoryObj<typeof Choice<string>>;

/** Equal buttons, as for the scoreboard's "Spielstand / Verlauf". */
export const Segments: Story = { args: { style: ChoiceStyle.Segments } };

/** On a track, as in Settings. */
export const Track: Story = { args: { style: ChoiceStyle.Track } };

/** Custom rules: nothing matches a preset. */
export const NothingSelected: Story = { args: { value: null } };
