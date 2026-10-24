import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Bob, FIXED, IconButton, IconName, Logo, useTheme } from '@/ui';
import type { AvatarView } from '@/shared';

import { ProfileChip } from './ProfileChip';

type HomeHeaderProps = {
  profile: { name: string; avatar: AvatarView } | null;
  onOpenSettings: () => void;
  onEditProfile: () => void;
};

/** Top bar of Start: logo, settings button and the profile chip. */
export function HomeHeader({ profile, onOpenSettings, onEditProfile }: HomeHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 12,
      }}
    >
      <Bob tilt={-8} distance={4}>
        <Logo size={52} body={colors.felt} pips={FIXED.dieFace} label={t('home.welcome')} />
      </Bob>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <IconButton
          icon={IconName.Settings}
          label={t('home.settings')}
          onPress={onOpenSettings}
          filled
          size={44}
        />
        {profile ? (
          <ProfileChip name={profile.name} avatar={profile.avatar} onPress={onEditProfile} />
        ) : null}
      </View>
    </View>
  );
}
