import { StyleSheet } from 'react-native';

/** The rows shared by the ranking list and the training facts. */
export const rankingStyles = StyleSheet.create({
  ranking: { gap: 10 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  flex: { flex: 1 },
});
