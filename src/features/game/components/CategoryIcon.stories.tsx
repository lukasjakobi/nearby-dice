import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Category } from '@/domain';
import { i18n } from '@/i18n';
import { Text, TextVariant, useTheme } from '@/ui';

import { CategoryIcon } from './CategoryIcon';

const UPPER = [
  Category.Ones,
  Category.Twos,
  Category.Threes,
  Category.Fours,
  Category.Fives,
  Category.Sixes,
];

/** Every field's icon: die faces for the upper block, drawings for the lower. */
function Gallery() {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {Object.values(Category).map((category) => {
        const face = UPPER.indexOf(category) + 1 || null;

        return (
          <View key={category} style={{ width: 96, alignItems: 'center', gap: 6 }}>
            <CategoryIcon category={category} face={face} color={colors.ink} size={40} />
            <Text variant={TextVariant.Small} color="muted" align="center">
              {i18n.t(`labels.category.${category}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const meta: Meta<typeof CategoryIcon> = {
  title: 'Features/Game/CategoryIcon',
  component: CategoryIcon,
  args: { category: Category.FullHouse, face: null, color: '#15191C', size: 64 },
  argTypes: { category: { control: 'select', options: Object.values(Category) } },
};

export default meta;
type Story = StoryObj<typeof CategoryIcon>;

export const Single: Story = {};

export const All: Story = { render: () => <Gallery /> };
