import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { LanguageMode, ThemeMode } from '@/store';
import { SwitchList } from '@/shared';
import {
  Button,
  ButtonVariant,
  Choice,
  ChoiceStyle,
  Dialog,
  FadeIn,
  Header,
  IconName,
  Screen,
  Text,
  TextVariant,
} from '@/ui';

import { NearbyPermissionCard, ProfileCard, SettingsSection } from './components';
import { useSettingsScreen } from './hooks';

const THEMES = [ThemeMode.System, ThemeMode.Light, ThemeMode.Dark];
const LANGUAGES = [LanguageMode.System, LanguageMode.German, LanguageMode.English];

export function SettingsScreen() {
  const { t } = useTranslation();
  const screen = useSettingsScreen();
  const { settings } = screen;
  const themeOptions = THEMES.map((value) => ({ value, label: t(`labels.themeMode.${value}`) }));
  const languageOptions = LANGUAGES.map((value) => ({
    value,
    label: t(`labels.languageMode.${value}`),
  }));
  const switches = [
    ...screen.feedbackSwitches.rows,
    { key: 'keepAwake', label: t('settings.keepAwake'), value: settings.keepAwake },
  ] as const;

  return (
    <Screen>
      <Header
        title={t('settings.title')}
        leading={{ icon: IconName.Back, label: t('common.back'), onPress: screen.back }}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 22 }}
      >
        {screen.profile ? (
          <ProfileCard
            name={screen.profile.name}
            avatar={screen.profile.avatar}
            onPress={screen.editProfile}
          />
        ) : null}

        <SettingsSection title={t('settings.appearance')}>
          <Choice
            label={t('settings.appearance')}
            options={themeOptions}
            value={settings.themeMode}
            onChange={settings.setThemeMode}
            style={ChoiceStyle.Track}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.language')}>
          <Choice
            label={t('settings.language')}
            options={languageOptions}
            value={settings.languageMode}
            onChange={settings.setLanguageMode}
            style={ChoiceStyle.Track}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.game')}>
          <SwitchList
            rows={switches}
            onToggle={settings.toggle}
            onVolume={screen.feedbackSwitches.setVolume}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.connection')}>
          <NearbyPermissionCard
            granted={screen.permissionGranted}
            onOpenSettings={screen.openSystemSettings}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.data')}>
          <Button
            label={t('settings.resetStats')}
            onPress={screen.askReset}
            variant={ButtonVariant.DangerOutline}
            alignStart
            height={56}
          />
          {screen.resetDone ? (
            <FadeIn>
              <Text
                variant={TextVariant.Label}
                color="ok"
                accessibilityRole="alert"
                style={{ paddingHorizontal: 4 }}
              >
                {t('settings.resetDone')}
              </Text>
            </FadeIn>
          ) : null}
        </SettingsSection>

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}
        >
          <Text variant={TextVariant.Body} size={14} color="muted">
            {t('settings.version')}
          </Text>
          <Text variant={TextVariant.Body} size={14} color="muted">
            {screen.version}
          </Text>
        </View>
      </ScrollView>
      <Dialog
        visible={screen.resetOpen}
        title={t('settings.resetDialog.title')}
        body={t('settings.resetDialog.body')}
        confirm={{ label: t('settings.resetDialog.confirm'), onPress: screen.confirmReset }}
        cancel={{ label: t('common.cancel'), onPress: screen.cancelReset }}
      />
    </Screen>
  );
}
