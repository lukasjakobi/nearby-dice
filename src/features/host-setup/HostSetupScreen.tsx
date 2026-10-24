import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { TFunction } from '@/i18n';
import { PermissionSheet, PresetDescription, PresetGrid } from '@/shared';
import { ROUND_NAME_MAX_LENGTH } from '@/domain';
import { Button, Footer, Header, IconName, Screen, Text, TextField, TextVariant } from '@/ui';

import { HostErrorCard } from './components';
import { OpenState, useHostSetup } from './hooks';

function openButtonLabel(t: TFunction, state: OpenState): string {
  const labels: Record<OpenState, string> = {
    [OpenState.Idle]: t('hostSetup.open'),
    [OpenState.Opening]: t('hostSetup.opening'),
    [OpenState.Failed]: t('hostSetup.retry'),
  };

  return labels[state];
}

export function HostSetupScreen() {
  const { t } = useTranslation();
  const setup = useHostSetup();
  const error = setup.error
    ? { title: t(`errors.host.${setup.error}.title`), body: t(`errors.host.${setup.error}.body`) }
    : null;

  return (
    <Screen keyboardAvoiding>
      <Header
        title={t('hostSetup.title')}
        leading={{ icon: IconName.Back, label: t('common.back'), onPress: setup.back }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label={t('hostSetup.roundNameLabel')}
          value={setup.roundName}
          onChangeText={setup.setRoundName}
          maxLength={ROUND_NAME_MAX_LENGTH}
          error={setup.roundNameError}
        />

        <View style={{ gap: 10 }}>
          <Text variant={TextVariant.Label}>{t('hostSetup.styleLabel')}</Text>
          <PresetGrid value={setup.preset} onChange={setup.choosePreset} />
          <PresetDescription preset={setup.preset} />
        </View>
      </ScrollView>

      <Footer>
        {error ? <HostErrorCard error={error} /> : null}
        <Button
          label={openButtonLabel(t, setup.openState)}
          onPress={setup.open}
          loading={setup.openState === OpenState.Opening}
        />
      </Footer>
      {setup.permissionSheet ? <PermissionSheet {...setup.permissionSheet} /> : null}
    </Screen>
  );
}
