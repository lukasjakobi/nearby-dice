import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { PermissionStatus } from '@/net';
import { useProfileStore, useSettingsStore, useStatsStore } from '@/store';
import { avatarOf, navigate, ProfileMode, Route, useFeedbackSwitches } from '@/shared';

import { buildUpdateView } from '../view';

import { updatesSupported } from './appUpdater';
import { useAppUpdate } from './useAppUpdate';
import { useNearbyPermission } from './useNearbyPermission';

export function useSettingsScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore();
  const resetStats = useStatsStore((s) => s.reset);
  const permission = useNearbyPermission();
  const feedbackSwitches = useFeedbackSwitches();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const version = Constants.expoConfig?.version;
  const appUpdate = useAppUpdate(version);

  return {
    profile: profile ? { name: profile.name, avatar: avatarOf(profile) } : null,
    settings,
    feedbackSwitches,
    permissionGranted: permission === null || permission === PermissionStatus.Granted,
    openSystemSettings: () => void Linking.openSettings(),
    resetOpen,
    resetDone,
    askReset: () => {
      setResetDone(false);
      setResetOpen(true);
    },
    cancelReset: () => setResetOpen(false),
    confirmReset: () => {
      resetStats();
      setResetOpen(false);
      setResetDone(true);
    },
    version,
    update: updatesSupported ? buildUpdateView(t, appUpdate.state) : null,
    runUpdate: appUpdate.run,
    editProfile: () => navigate.push(Route.Profile, { mode: ProfileMode.Edit }),
    back: () => navigate.back(),
  };
}
