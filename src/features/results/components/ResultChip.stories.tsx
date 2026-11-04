import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';
import { IconName, mix, useTheme } from '@/ui';

import { ResultChip } from './ResultChip';

/** The Yatzy chip as a standings row shows it under a name. */
function Chips() {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <ResultChip
        label={i18n.t('labels.category.yatzy')}
        icon={IconName.StarFilled}
        background={mix(colors.accent, colors.surface, 0.28)}
        color={colors.ink}
        weight={600}
      />
    </View>
  );
}

const meta: Meta<typeof ResultChip> = {
  title: 'Features/Results/ResultChip',
  component: ResultChip,
};

export default meta;

export const Yatzy: StoryObj<typeof ResultChip> = { render: () => <Chips /> };
