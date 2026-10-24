import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { PermissionSheet } from '@/shared';
import {
  Button,
  ButtonVariant,
  Header,
  IconName,
  Screen,
  StatusTone,
  StatusView,
  Text,
  TextVariant,
} from '@/ui';

import { CodeInput, JoinProgress, NearbyRounds } from './components';
import { JoinPhase, useJoinFlow } from './hooks';

export function JoinScreen() {
  const { t } = useTranslation();
  const flow = useJoinFlow();
  const error = {
    title: t(`errors.join.${flow.error}.title`),
    body: t(`errors.join.${flow.error}.body`),
  };

  const content: Record<JoinPhase, ReactNode> = {
    [JoinPhase.Checking]: (
      <StatusView
        icon={IconName.Bluetooth}
        title={t('permission.fallbackTitle')}
        body={t('permission.fallbackBody')}
      />
    ),
    [JoinPhase.Access]: (
      <StatusView
        icon={IconName.Bluetooth}
        title={t('permission.fallbackTitle')}
        body={t('permission.fallbackBody')}
        actions={<Button label={t('permission.check')} onPress={flow.recheck} />}
      />
    ),
    [JoinPhase.Entry]: (
      <>
        <View style={{ flex: 1, gap: 28, paddingTop: 12 }}>
          <Text variant={TextVariant.Hero}>{t('join.codeTitle')}</Text>
          <CodeInput value={flow.code} onChange={flow.setCode} />
          <NearbyRounds
            rounds={flow.rounds}
            scanning={flow.scanning}
            onJoin={flow.joinRound}
            onRefresh={flow.refresh}
            error={flow.scanError}
          />
        </View>
        <Button label={t('join.join')} onPress={flow.join} disabled={!flow.canJoin} />
      </>
    ),
    [JoinPhase.Working]: (
      <>
        <JoinProgress code={flow.code} step={flow.step} />
        <Button
          label={t('common.cancel')}
          onPress={flow.cancel}
          variant={ButtonVariant.Secondary}
        />
      </>
    ),
    [JoinPhase.Success]: (
      <StatusView
        icon={IconName.Check}
        tone={StatusTone.Success}
        title={t('join.successTitle')}
        body={t('join.successBody')}
      />
    ),
    [JoinPhase.Error]: (
      <StatusView
        icon={IconName.Warning}
        tone={StatusTone.Danger}
        title={error.title}
        body={error.body}
        alert
        actions={
          <>
            {flow.canRetry ? <Button label={t('join.retry')} onPress={flow.retry} /> : null}
            <Button
              label={t('join.otherCode')}
              onPress={flow.otherCode}
              variant={ButtonVariant.Secondary}
            />
          </>
        }
      />
    ),
  };

  return (
    <Screen keyboardAvoiding>
      <Header
        title={t('join.title')}
        leading={{ icon: IconName.Back, label: t('common.back'), onPress: flow.back }}
      />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 20 }}>
        {content[flow.phase]}
      </View>
      {flow.permissionSheet ? <PermissionSheet {...flow.permissionSheet} /> : null}
    </Screen>
  );
}
