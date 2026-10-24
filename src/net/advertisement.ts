import { isPlayerColor } from '@/domain';
import type { PlayerColor } from '@/domain';

import { isValidRoundCode } from './roundCode';

/** What a host broadcasts so guests can list the round under "In deiner Nähe". */
export type Advertisement = {
  code: string;
  roundName: string;
  hostName: string;
  hostColor: PlayerColor;
  players: number;
  maxPlayers: number;
};

const VERSION = 'v1';
const SEPARATOR = '|';

const clean = (text: string) => text.replaceAll(SEPARATOR, '/');

/** Encodes into the Nearby endpoint name: `v1|code|players|max|color|host|round`. */
export function encodeAdvertisement(ad: Advertisement): string {
  return [
    VERSION,
    ad.code,
    ad.players,
    ad.maxPlayers,
    ad.hostColor,
    clean(ad.hostName),
    clean(ad.roundName),
  ].join(SEPARATOR);
}

/** Returns `null` for anything that is not a valid v1 advertisement. */
export function decodeAdvertisement(name: string): Advertisement | null {
  const [version, code, players, maxPlayers, hostColor, hostName, roundName] =
    name.split(SEPARATOR);
  if (version !== VERSION || !isValidRoundCode(code ?? '') || !isPlayerColor(hostColor))
    return null;
  const ad: Advertisement = {
    code,
    players: Number(players),
    maxPlayers: Number(maxPlayers),
    hostColor,
    hostName: hostName ?? '',
    roundName: roundName ?? '',
  };
  if (!Number.isInteger(ad.players) || !Number.isInteger(ad.maxPlayers) || !ad.hostName)
    return null;

  return ad;
}

export function isFull(ad: Advertisement): boolean {
  return ad.players >= ad.maxPlayers;
}
