import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { TRAINING_PRESET_ORDER } from '@/domain';
import { PresetGrid, RulesSheet } from '@/shared';
import { Button, Footer, Header, Icon, IconName, Screen, Text, TextVariant, useTheme } from '@/ui';

import { useTrainingSetup } from './hooks';

/** "Training": pick a style, then play alone. */
export function TrainingSetupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const setup = useTrainingSetup();

  return (
    <Screen>
      <Header
        title={t('training.title')}
        leading={{ icon: IconName.Back, label: t('common.back'), onPress: setup.back }}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 24 }}
      >
        <Text variant={TextVariant.Body} color="muted">
          {t('training.intro')}
        </Text>

        <PresetGrid
          value={setup.preset}
          onChange={setup.choosePreset}
          presets={TRAINING_PRESET_ORDER}
          onRules={setup.openRules}
        />

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Icon name={IconName.Info} color={colors.muted} size={18} strokeWidth={2} />
          <Text variant={TextVariant.Caption} color="muted" style={{ flex: 1 }}>
            {t('training.note')}
          </Text>
        </View>
      </ScrollView>

      <Footer>
        <Button label={t('training.start')} onPress={setup.start} />
      </Footer>
      <RulesSheet visible={setup.rulesOpen} preset={setup.preset} onClose={setup.closeRules} />
    </Screen>
  );
}
