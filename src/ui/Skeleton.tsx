import { View } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

type SkeletonProps = { height: number };

/** A grey block standing in for a row that is still loading. */
export function Skeleton({ height }: SkeletonProps) {
  const { colors } = useTheme();

  return (
    <View style={{ height, borderRadius: 16, backgroundColor: colors.surface2, opacity: 0.7 }} />
  );
}
