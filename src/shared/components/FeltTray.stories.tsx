import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { DieFace } from '@/ui';

import { FeltTray } from './FeltTray';

const meta: Meta<typeof FeltTray> = {
  title: 'Shared/Game/FeltTray',
  component: FeltTray,
  args: {
    children: (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[3, 5, 1, 6, 2].map((value, i) => (
          <DieFace key={i} value={value} tilt={[-4, 3, -2, 4, -3][i]} />
        ))}
      </View>
    ),
  },
};

export default meta;

export const WithDice: StoryObj<typeof FeltTray> = {};
