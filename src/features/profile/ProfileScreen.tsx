import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { NAME_MAX_LENGTH } from '@/domain';
import { Avatar, Button, ButtonVariant, Dialog, Header, IconName, Screen, TextField } from '@/ui';
import { ColorPicker, ProfileMode } from '@/shared';

import { SavedNotice } from './components';
import { useProfileScreen } from './hooks';

export function ProfileScreen() {
  const { t } = useTranslation();
  const screen = useProfileScreen();
  const { form } = screen;
  const editing = screen.mode === ProfileMode.Edit;

  return (
    <Screen keyboardAvoiding>
      <Header
        title={editing ? t('profile.titleEdit') : t('profile.titleCreate')}
        leading={{ icon: IconName.Back, label: t('common.back'), onPress: screen.back }}
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <Avatar initial={form.avatar.initial} color={form.avatar.color} size={112} framed />
        </View>
        <TextField
          label={t('profile.nameLabel')}
          value={form.name}
          onChangeText={form.setName}
          maxLength={NAME_MAX_LENGTH}
          placeholder={t('profile.namePlaceholder')}
          error={form.error}
          help={t('profile.help')}
          showCounter
        />
        <ColorPicker label={t('profile.colorLabel')} value={form.color} onChange={form.setColor} />
        <View style={{ flex: 1 }} />
        {screen.saved ? <SavedNotice /> : null}
        <View style={{ gap: 10 }}>
          <Button
            label={editing ? t('profile.saveEdit') : t('profile.saveCreate')}
            onPress={screen.save}
            disabled={!form.valid}
          />
          {editing ? (
            <Button
              label={t('profile.reset')}
              onPress={screen.askReset}
              variant={ButtonVariant.DangerOutline}
            />
          ) : null}
        </View>
      </ScrollView>
      <Dialog
        visible={screen.resetOpen}
        title={t('profile.resetDialog.title')}
        body={t('profile.resetDialog.body')}
        confirm={{ label: t('profile.resetDialog.confirm'), onPress: screen.confirmReset }}
        cancel={{ label: t('common.cancel'), onPress: screen.cancelReset }}
      />
    </Screen>
  );
}
