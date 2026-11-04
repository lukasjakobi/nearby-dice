import { Children, Fragment } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';

type ListGroupProps = {
  children: ReactNode;
  /** Indents the hairlines to start after the rows' leading icon or avatar. */
  inset?: number;
  style?: StyleProp<ViewStyle>;
};

/** One card holding rows separated by hairlines: settings, lobby players, rules. */
export function ListGroup({ children, inset = 0, style }: ListGroupProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children);

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.card,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <View style={{ height: 1, marginLeft: inset, backgroundColor: colors.line }} />
          ) : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}
