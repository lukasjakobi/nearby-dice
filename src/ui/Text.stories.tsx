import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Text, TextVariant } from './Text';
import { TEXT_VARIANTS } from './theme/typography';

const meta: Meta<typeof Text> = {
  title: 'UI/Foundations/Text',
  component: Text,
  args: { children: 'Würfel fallen, Punkte zählen.', variant: TextVariant.Body, color: 'ink' },
  argTypes: { variant: { control: 'select', options: Object.values(TextVariant) } },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Playground: Story = {};

/** Every text style with its size and weight: Fredoka for display, Work Sans for the rest. */
export const Variants: Story = {
  render: () => (
    <View style={{ gap: 14 }}>
      {Object.values(TextVariant).map((variant) => {
        const { font, size, weight } = TEXT_VARIANTS[variant];

        return (
          <View key={variant} style={{ gap: 2 }}>
            <Text variant={TextVariant.Small} color="muted">
              {`${variant} · ${font} ${size}/${weight}`}
            </Text>
            <Text variant={variant}>Lukas’ Runde: 236 Punkte</Text>
          </View>
        );
      })}
    </View>
  ),
};

export const Colours: Story = {
  render: () => (
    <View style={{ gap: 6 }}>
      <Text color="ink">ink – Fließtext</Text>
      <Text color="muted">muted – Hinweise und Nebensachen</Text>
      <Text color="primary">primary – Aktionen im Text</Text>
      <Text color="danger">danger – Fehler</Text>
      <Text color="ok">ok – Verbunden</Text>
    </View>
  ),
};
