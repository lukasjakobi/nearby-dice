import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View, useWindowDimensions } from 'react-native';

import { RadioState } from '@/net';
import { Button, ButtonVariant, BottomSheet, Text, TextVariant } from '@/ui';

export type PermissionSheetState =
  | { variant: 'primer' }
  | { variant: 'blocked'; problem?: 'unavailable' | 'check' }
  | { variant: 'radio'; radio: RadioState.BluetoothOff | RadioState.LocationOff };

export type PermissionSheetProps = {
  state: PermissionSheetState;
  busy: boolean;
  settingsError: boolean;
  onAction: () => void;
  onClose: () => void;
};

export function PermissionSheet({
  state,
  busy,
  settingsError,
  onAction,
  onClose,
}: PermissionSheetProps) {
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const section =
    state.variant === 'primer'
      ? 'primer'
      : state.variant === 'radio'
        ? state.radio === RadioState.LocationOff
          ? 'locationOff'
          : 'bluetoothOff'
        : state.problem === 'unavailable'
          ? 'unavailable'
          : state.problem === 'check'
            ? 'checkFailed'
            : 'blocked';
  const content = {
    title: t(`permission.${section}.title`),
    body: t(`permission.${section}.body`),
  };
  const label =
    state.variant === 'primer'
      ? t('permission.allow')
      : state.variant === 'blocked' && state.problem
        ? t('permission.retry')
        : t('permission.openSettings');

  return (
    <BottomSheet visible onClose={onClose} title={content.title}>
      <ScrollView
        style={{ flexGrow: 0, maxHeight: height * 0.65 }}
        contentContainerStyle={{ gap: 12 }}
      >
        <Text variant={TextVariant.Body} color="muted">
          {content.body}
        </Text>
        {Platform.OS === 'android' &&
        (state.variant === 'primer' || (state.variant === 'blocked' && !state.problem)) ? (
          <Text variant={TextVariant.Body} color="muted">
            {t('permission.androidLocation')}
          </Text>
        ) : null}
        {settingsError ? (
          <Text variant={TextVariant.Body} color="danger" accessibilityRole="alert">
            {t('permission.settingsFailed')}
          </Text>
        ) : null}
        <View style={{ gap: 10, paddingTop: 8 }}>
          <Button label={label} onPress={onAction} loading={busy} />
          <Button
            label={t('permission.later')}
            onPress={onClose}
            variant={ButtonVariant.Secondary}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
