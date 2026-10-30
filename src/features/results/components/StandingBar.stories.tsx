import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';
import { useTheme } from '@/ui';

import { finished } from './fixtures';
import { StandingBar } from './StandingBar';

/** Every player's bar, each growing a little after the one above. */
function Bars() {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 12 }}>
      {finished(i18n.t).standings.rows.map((row, i) => (
        <StandingBar key={row.id} row={row} background={colors.bg} index={i} />
      ))}
    </View>
  );
}

const meta: Meta<typeof StandingBar> = {
  title: 'Features/Results/StandingBar',
  component: StandingBar,
};

export default meta;

/** Upper block, bonus and lower block, as long as the points against the winner's. */
export const AllPlayers: StoryObj<typeof StandingBar> = { render: () => <Bars /> };
