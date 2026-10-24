import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { NAME_MAX_LENGTH } from '@/domain';
import { Avatar, TextField } from '@/ui';
import { ColorPicker } from '@/shared';
import type { ProfileForm } from '@/shared';

import { SlideText } from './SlideText';

export function ProfileSlide({ form }: { form: ProfileForm }) {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, gap: 22, paddingTop: 12 }}>
      <View style={{ alignItems: 'center', gap: 22 }}>
        <Avatar initial={form.avatar.initial} color={form.avatar.color} size={112} framed />
        <SlideText title={t('onboarding.slides.profile.title')} body="" />
      </View>
      <TextField
        label={t('onboarding.nameLabel')}
        value={form.name}
        onChangeText={form.setName}
        maxLength={NAME_MAX_LENGTH}
        placeholder={t('onboarding.namePlaceholder')}
        error={form.error}
      />
      <ColorPicker label={t('onboarding.colorLabel')} value={form.color} onChange={form.setColor} />
    </View>
  );
}
