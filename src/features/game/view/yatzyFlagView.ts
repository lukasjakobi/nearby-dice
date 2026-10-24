import type { PlayerInfo } from '@/session';
import { avatarOf } from '@/shared';
import type { AvatarView } from '@/shared';

/** Who rolled the Yatzy; `seq` is their roll, so a second Yatzy replays the flag. */
export type YatzyFlagView = AvatarView & { seq: number; name: string };

export function buildYatzyFlag(roller: PlayerInfo, seq: number): YatzyFlagView {
  return { seq, name: roller.name, ...avatarOf(roller) };
}
