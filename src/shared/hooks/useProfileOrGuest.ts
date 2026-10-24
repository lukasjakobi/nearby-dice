import { PlayerColor } from '@/domain';
import type { Profile } from '@/domain';
import { useProfileStore } from '@/store';

/** Stands in when no profile exists (onboarding was skipped). */
export const GUEST_PROFILE: Profile = { name: '?', color: PlayerColor.Amber };

/** The saved profile, or `GUEST_PROFILE`. */
export function useProfileOrGuest(): Profile {
  return useProfileStore((s) => s.profile) ?? GUEST_PROFILE;
}
