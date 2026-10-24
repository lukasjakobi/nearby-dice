import { initialOf } from '@/domain';
import type { Profile } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

/** What every avatar needs. */
export type AvatarView = { initial: string; color: string };

export function avatarOf(player: Profile): AvatarView {
  return { initial: initialOf(player.name), color: PLAYER_COLOR_HEX[player.color] };
}
