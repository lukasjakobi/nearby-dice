import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View, useWindowDimensions } from 'react-native';

import { RadioState } from '@/net';
import {
  BottomSheet,
  Button,
  ButtonVariant,
  IconBadge,
  IconName,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';

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

type Section =
  'primer' | 'blocked' | 'bluetoothOff' | 'locationOff' | 'unavailable' | 'checkFailed';

/**
 * What each case shows above its title: the same "nearby" waves as the search on Join, the radio
 * that is off, or a warning when nothing helps.
 */
const SECTION_ICON: Record<Section, IconName> = {
  primer: IconName.Broadcast,
  blocked: IconName.Broadcast,
  bluetoothOff: IconName.Bluetooth,
  locationOff: IconName.Target,
  unavailable: IconName.Warning,
  checkFailed: IconName.Warning,
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
  const { colors } = useTheme();
  const section: Section =
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
    <BottomSheet visible onClose={onClose}>
      <ScrollView
        style={{ flexGrow: 0, maxHeight: height * 0.65 }}
        contentContainerStyle={{ gap: 12, alignItems: 'center' }}
      >
        <IconBadge icon={SECTION_ICON[section]} color={colors.primary} size={72} />
        <Text
          variant={TextVariant.DialogTitle}
          align="center"
          accessibilityRole="header"
          style={{ marginTop: 4 }}
        >
          {content.title}
        </Text>
        <Text variant={TextVariant.Body} color="muted" align="center">
          {content.body}
        </Text>
        {Platform.OS === 'android' &&
        (state.variant === 'primer' || (state.variant === 'blocked' && !state.problem)) ? (
          <Text variant={TextVariant.Body} color="muted" align="center">
            {t('permission.androidLocation')}
          </Text>
        ) : null}
        {settingsError ? (
          <Text variant={TextVariant.Body} color="danger" align="center" accessibilityRole="alert">
            {t('permission.settingsFailed')}
          </Text>
        ) : null}
        <View style={{ gap: 4, paddingTop: 8, alignSelf: 'stretch' }}>
          <Button label={label} onPress={onAction} loading={busy} />
          <Button label={t('permission.later')} onPress={onClose} variant={ButtonVariant.Quiet} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
