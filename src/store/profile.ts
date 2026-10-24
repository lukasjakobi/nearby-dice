import { isBoolean, isPlayerColor, isRecord } from '@/domain';
import type { Profile } from '@/domain';
import { secureRandomId } from '@/lib';

import { createPersistedStore } from './createPersistedStore';

type ProfileData = {
  profile: Profile | null;
  onboardingDone: boolean;
  /** Stable per installation; the host recognises returning or banned devices by it. */
  deviceId: string;
};

const DEFAULTS: ProfileData = { profile: null, onboardingDone: false, deviceId: secureRandomId() };

function sanitizeProfile(stored: Record<string, unknown>): Partial<ProfileData> {
  const state: Partial<ProfileData> = {};
  if (stored.profile === null) state.profile = null;
  else if (
    isRecord(stored.profile) &&
    typeof stored.profile.name === 'string' &&
    isPlayerColor(stored.profile.color)
  ) {
    state.profile = { name: stored.profile.name, color: stored.profile.color };
  }

  if (isBoolean(stored.onboardingDone)) state.onboardingDone = stored.onboardingDone;
  if (typeof stored.deviceId === 'string' && stored.deviceId.length > 0) {
    state.deviceId = stored.deviceId;
  }

  return state;
}

export const useProfileStore = createPersistedStore({
  key: 'nearbydice.profile.v1',
  defaults: DEFAULTS,
  sanitize: sanitizeProfile,
  actions: (update) => ({
    saveProfile: (profile: Profile) =>
      update(() => ({ profile: { ...profile, name: profile.name.trim() } })),
    resetProfile: () => update(() => ({ profile: null })),
    completeOnboarding: () => update(() => ({ onboardingDone: true })),
  }),
});
