/** A finished game for this folder's stories (Storybook only), through the real builders. */
import { PlayerColor } from '@/domain';
import type { TFunction } from '@/i18n';
import { RematchVote } from '@/session';
import { ANTONIA, JONAS, LUKAS, savedGame } from '@/test/fixtures';
import { PLAYER_COLOR_HEX } from '@/ui';

import type { VoteChip } from '../hooks';
import { buildSavedGame } from '../view';
import type { SavedGameView } from '../view';

const GAME = savedGame([LUKAS, ANTONIA, JONAS], LUKAS);

/** What the results screen shows after the bots played a whole game. */
export const finished = (t: TFunction): SavedGameView => buildSavedGame(t, GAME);

export const VOTES: VoteChip[] = [
  {
    id: LUKAS.id,
    name: LUKAS.name,
    avatar: { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] },
    vote: RematchVote.Yes,
  },
  {
    id: ANTONIA.id,
    name: ANTONIA.name,
    avatar: { initial: 'A', color: PLAYER_COLOR_HEX[PlayerColor.Sky] },
    vote: RematchVote.Pending,
  },
  {
    id: JONAS.id,
    name: JONAS.name,
    avatar: { initial: 'J', color: PLAYER_COLOR_HEX[PlayerColor.Coral] },
    vote: RematchVote.No,
  },
];
