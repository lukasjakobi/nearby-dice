import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Card } from './Card';
import { Text, TextVariant } from './Text';

const meta: Meta<typeof Card> = {
  title: 'UI/Display/Card',
  component: Card,
  args: {
    children: (
      <Text variant={TextVariant.Body} size={14} color="muted">
        Noch keine Spiele. Hoste eine Runde oder tritt einer bei.
      </Text>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};

/** Empty slots and placeholders. */
export const Dashed: Story = { args: { dashed: true, radius: 16, padding: 16 } };

export const Danger: Story = { args: { border: 'danger', style: { borderWidth: 1.5 } } };

export const Tonal: Story = { args: { background: 'surface2', border: 'surface2' } };
