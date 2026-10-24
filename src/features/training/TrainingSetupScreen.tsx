import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { TRAINING_PRESET_ORDER } from '@/domain';
import { PresetDescription, PresetGrid } from '@/shared';
import { Button, Footer, Header, IconName, Screen, Text, TextVariant } from '@/ui';

import { useTrainingSetup } from './hooks';

/** "Training": pick a style, then play alone. */
export function TrainingSetupScreen() {
  const { t } = useTranslation();
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

        <View style={{ gap: 10 }}>
          <Text variant={TextVariant.Label}>{t('hostSetup.styleLabel')}</Text>
          <PresetGrid
            value={setup.preset}
            onChange={setup.choosePreset}
            presets={TRAINING_PRESET_ORDER}
          />
          <PresetDescription preset={setup.preset} />
        </View>

        <Text variant={TextVariant.Caption} color="muted">
          {t('training.note')}
        </Text>
      </ScrollView>

      <Footer>
        <Button label={t('training.start')} onPress={setup.start} />
      </Footer>
    </Screen>
  );
}
