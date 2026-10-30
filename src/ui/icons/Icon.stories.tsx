import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Text, TextVariant } from '../Text';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconName } from './Icon';

function Gallery() {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {Object.values(IconName).map((name) => (
        <View key={name} style={{ width: 84, alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <Icon name={name} color={colors.ink} />
          <Text variant={TextVariant.Small} color="muted" align="center">
            {name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const meta: Meta<typeof Icon> = {
  title: 'UI/Foundations/Icon',
  component: Icon,
  args: { name: IconName.Trophy, color: '#0B7A65', size: 48, strokeWidth: 2.2 },
  argTypes: { name: { control: 'select', options: Object.values(IconName) } },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Single: Story = {};

export const All: Story = { render: () => <Gallery /> };
