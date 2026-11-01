import { StyleSheet, View } from 'react-native';

import type { PlayerBoard } from '../view';
import { StandingTile } from './StandingTile';

type StandingsProps = {
  label: string;
  /** Highest total first. */
  players: PlayerBoard[];
  selected: string;
  onSelect: (id: string) => void;
};

/** Tiles per row: one row up to three players, two by two with four, then rows of three. */
const columnsFor = (count: number) => (count <= 3 ? count : count === 4 ? 2 : 3);

/** The players ranked by total; picking one opens their sheet below. */
export function Standings({ label, players, selected, onSelect }: StandingsProps) {
  const columns = columnsFor(players.length);
  const rows = Array.from({ length: Math.ceil(players.length / columns) }, (_, i) =>
    players.slice(i * columns, (i + 1) * columns),
  );

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((player) => (
            <StandingTile
              key={player.id}
              player={player}
              selected={player.id === selected}
              onSelect={onSelect}
            />
          ))}
          {/* Keeps the tiles of a shorter last row as wide as the ones above. */}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={i} style={styles.filler} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  filler: { flex: 1 },
});
