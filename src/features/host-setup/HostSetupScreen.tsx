import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import type { TFunction } from '@/i18n';
import { PermissionSheet, PresetGrid, RulesSheet } from '@/shared';
import { Button, Footer, Header, IconName, Screen } from '@/ui';

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
    <Screen>
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
      >
        <PresetGrid value={setup.preset} onChange={setup.choosePreset} onRules={setup.openRules} />
      </ScrollView>

      <Footer>
        {error ? <HostErrorCard error={error} /> : null}
        <Button
          label={openButtonLabel(t, setup.openState)}
          onPress={setup.open}
          loading={setup.openState === OpenState.Opening}
        />
      </Footer>
      <RulesSheet visible={setup.rulesOpen} preset={setup.preset} onClose={setup.closeRules} />
      {setup.permissionSheet ? <PermissionSheet {...setup.permissionSheet} /> : null}
    </Screen>
  );
}
