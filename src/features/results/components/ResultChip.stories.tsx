import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';
import { IconName, mix, useTheme } from '@/ui';

import { ResultChip } from './ResultChip';

/** Both chips as a standings row shows them under a name. */
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
      <ResultChip
        label={i18n.t('results.noBonus', { sum: 52, need: 63 })}
        background={mix(colors.ink, colors.surface, 0.09)}
        color={colors.muted}
        weight={500}
      />
    </View>
  );
}

const meta: Meta<typeof ResultChip> = {
  title: 'Features/Results/ResultChip',
  component: ResultChip,
};

export default meta;

export const YatzyAndNoBonus: StoryObj<typeof ResultChip> = { render: () => <Chips /> };
