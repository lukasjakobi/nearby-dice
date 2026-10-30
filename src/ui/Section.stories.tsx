import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Choice, ChoiceStyle } from './Choice';
import { Section } from './Section';
import { Text, TextVariant } from './Text';

const meta: Meta<typeof Section> = {
  title: 'UI/Layout/Section',
  component: Section,
  args: {
    title: 'Darstellung',
    children: (
      <Choice
        label="Darstellung"
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Hell' },
          { value: 'dark', label: 'Dunkel' },
        ]}
        value="system"
        onChange={fn()}
        style={ChoiceStyle.Track}
      />
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {};

/** As in the lobbies: "Spieler" with the count on the right. */
export const WithTrailing: Story = {
  args: {
    title: 'Spieler',
    gap: 14,
    trailing: (
      <Text variant={TextVariant.Body} size={14} color="muted">
        2 von 4
      </Text>
    ),
    children: <Text color="muted">Lobby-Zeilen</Text>,
  },
};
