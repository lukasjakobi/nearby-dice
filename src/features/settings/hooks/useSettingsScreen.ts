import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { HarnessParam, harnessParam } from '@/lib';
import { PermissionStatus } from '@/net';
import { useProfileStore, useSettingsStore, useStatsStore } from '@/store';
import { avatarOf, navigate, ProfileMode, Route, useFeedbackSwitches } from '@/shared';

import { buildUpdateView, UpdateStatus } from '../view';
import type { UpdateState } from '../view';

import { updatesSupported } from './appUpdater';
import { useAppUpdate } from './useAppUpdate';
import { useCopyDiagnostics } from './useCopyDiagnostics';
import { useNearbyPermission } from './useNearbyPermission';

/** The release the frozen card names; any version newer than the installed one reads right. */
const HARNESS_RELEASE = { version: '9.9.0', percent: 42 };

/**
 * The browser harness has no Android installer, so `?update=available` shows the card frozen in
 * that state instead (docs/technical-design.md, Browser harness). Phones never have the option.
 */
function harnessUpdate(): UpdateState | null {
  const status = Object.values(UpdateStatus).find((s) => s === harnessParam(HarnessParam.Update));

  // Every state takes what it needs from the same release and ignores the rest.
  return status ? ({ status, ...HARNESS_RELEASE } as UpdateState) : null;
}

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
  const updateState = harnessUpdate() ?? (updatesSupported ? appUpdate.state : null);
  const copyDiagnostics = useCopyDiagnostics(version);

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
    update: updateState ? buildUpdateView(t, updateState) : null,
    runUpdate: appUpdate.run,
    /** Development builds only, for now: players of a release have no use for it yet. */
    copyDiagnostics: __DEV__ ? () => void copyDiagnostics() : null,
    editProfile: () => navigate.push(Route.Profile, { mode: ProfileMode.Edit }),
    back: () => navigate.back(),
  };
}
