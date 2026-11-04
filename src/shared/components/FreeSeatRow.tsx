import { View } from 'react-native';

import { Icon, IconName, Spinner, Text, TextVariant, useTheme } from '@/ui';

export type FreeSeatRowProps = { title: string; hint?: string; waiting?: boolean };

/** "Platz frei" / "Warte auf Mitspieler …": the last row of the players' `ListGroup`. */
export function FreeSeatRow({ title, hint, waiting = false }: FreeSeatRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        paddingVertical: 8,
        paddingHorizontal: 14,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.control,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {waiting ? (
          <Spinner color={colors.muted} size={20} strokeWidth={2.4} />
        ) : (
          <Icon name={IconName.User} color={colors.muted} size={20} strokeWidth={2} />
        )}
      </View>
      <View style={{ gap: 2, flex: 1 }}>
        <Text variant={TextVariant.Body} weight={500} color="muted">
          {title}
        </Text>
        {hint ? (
          <Text variant={TextVariant.Caption} color="muted">
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
