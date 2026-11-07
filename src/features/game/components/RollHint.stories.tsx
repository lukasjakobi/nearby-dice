import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { useTheme } from '@/ui';

import { RollHint } from './RollHint';

const meta: Meta<typeof RollHint> = {
  title: 'Features/Game/RollHint',
  component: RollHint,
  args: { label: 'Feld wählen' },
  decorators: [
    function OnFelt(Story) {
      const { colors } = useTheme();

      return (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.felt }}>
          <Story />
        </View>
      );
    },
  ],
};

export default meta;

/** No roll left: the hint points up at the scorecard. */
export const PickAField: StoryObj<typeof RollHint> = {};
