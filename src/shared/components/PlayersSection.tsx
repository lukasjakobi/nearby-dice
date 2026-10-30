import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Section, Text, TextVariant } from '@/ui';

import { FreeSeatRow } from './FreeSeatRow';
import type { FreeSeatRowProps } from './FreeSeatRow';
import { PlayerRow, PlayerTag } from './PlayerRow';
import type { PlayerRowView } from './PlayerRow';

type PlayersSectionProps = {
  rows: PlayerRowView[];
  maxPlayers: number;
  /** The dashed row below the players, if a seat is free. */
  freeSeat: FreeSeatRowProps | null;
  /** Host lobby: the ⋯ menu on every row except the host's own. */
  onPlayerMenu?: (row: PlayerRowView) => void;
};

/** "Spieler · n von max" and the lobby rows, shared by host and guest lobby. */
export function PlayersSection({ rows, maxPlayers, freeSeat, onPlayerMenu }: PlayersSectionProps) {
  const { t } = useTranslation();

  return (
    <Section
      title={t('lobby.playersTitle')}
      gap={14}
      trailing={
        <Text variant={TextVariant.Body} size={14} color="muted" accessibilityLiveRegion="polite">
          {t('lobby.playerCount', { n: rows.length, max: maxPlayers })}
        </Text>
      }
    >
      <View style={{ gap: 10 }}>
        {rows.map((row) => (
          <PlayerRow
            key={row.id}
            row={row}
            onMenu={
              onPlayerMenu && !row.tags.includes(PlayerTag.Host)
                ? () => onPlayerMenu(row)
                : undefined
            }
            menuLabel={t('lobby.playerActions', { name: row.name })}
          />
        ))}
        {freeSeat ? <FreeSeatRow {...freeSeat} /> : null}
      </View>
    </Section>
  );
}
