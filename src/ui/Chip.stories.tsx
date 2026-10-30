import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Chip } from './Chip';
import { IconName } from './icons/Icon';

const meta: Meta<typeof Chip> = {
  title: 'UI/Actions/Chip',
  component: Chip,
  args: { onPress: fn() },
  argTypes: {
    leading: { control: 'select', options: [undefined, ...Object.values(IconName)] },
    trailing: { control: 'select', options: [undefined, ...Object.values(IconName)] },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

/** Above another player's sheet in the game. */
export const Back: Story = { args: { label: 'Zurück', leading: IconName.Back } };

/** Over the scorecard's fade when fields are hidden below. */
export const MoreBelow: Story = {
  args: { label: 'Weitere Felder', trailing: IconName.ChevronDown },
};

export const TextOnly: Story = { args: { label: 'Regeln' } };
