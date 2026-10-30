import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { PLAYER_COLORS, PlayerColor } from '@/domain';
import { i18n } from '@/i18n';

import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Shared/Profile/ColorPicker',
  component: ColorPicker,
  args: { value: PlayerColor.Amber, onChange: fn() },
  argTypes: { value: { control: 'select', options: PLAYER_COLORS } },
  render: function ControlledPicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <ColorPicker
        {...args}
        label={i18n.t('onboarding.colorLabel')}
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

export const Default: StoryObj<typeof ColorPicker> = {};
