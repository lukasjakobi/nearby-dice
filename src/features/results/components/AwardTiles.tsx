import { StyleSheet, View } from 'react-native';

import type { Award } from '../view';
import { AwardTile } from './AwardTile';

/** A few highlights of the game side by side: highest entry, upper bonus, most zeros. */
export function AwardTiles({ awards }: { awards: Award[] }) {
  return (
    <View style={styles.tiles}>
      {awards.map((award) => (
        <AwardTile key={award.kind} award={award} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 8 },
});
