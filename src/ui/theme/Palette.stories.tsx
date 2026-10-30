import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Text, TextVariant } from '../Text';
import { useTheme } from './ThemeProvider';
import { FIXED, PLAYER_COLOR_HEX } from './tokens';

function Swatch({ name, color }: { name: string; color: string }) {
  const { colors } = useTheme();

  return (
    <View style={{ width: 104, gap: 4 }}>
      <View
        style={{
          height: 56,
          borderRadius: 14,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      />
      <Text variant={TextVariant.Label} size={13}>
        {name}
      </Text>
      <Text variant={TextVariant.Small} color="muted">
        {color}
      </Text>
    </View>
  );
}

function Group({ title, colors }: { title: string; colors: Record<string, string> }) {
  return (
    <View style={{ gap: 10 }}>
      <Text variant={TextVariant.SectionTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {Object.entries(colors).map(([name, color]) => (
          <Swatch key={name} name={name} color={color} />
        ))}
      </View>
    </View>
  );
}

function Palette() {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 24 }}>
      <Group title="Theme (useTheme)" colors={colors} />
      <Group title="Players" colors={PLAYER_COLOR_HEX} />
      <Group title="Fixed" colors={FIXED} />
    </View>
  );
}

const meta: Meta<typeof Palette> = { title: 'UI/Foundations/Palette', component: Palette };

export default meta;

/** Switch the theme in the toolbar; player and fixed colours stay the same in both. */
export const Colours: StoryObj<typeof Palette> = {};
