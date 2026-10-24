import { View } from 'react-native';

import { Icon, IconName, Spinner, Text, TextVariant, useTheme } from '@/ui';

export type FreeSeatRowProps = { title: string; hint?: string; waiting?: boolean };

/** The dashed "Platz frei" / "Warte auf Mitspieler …" row. */
export function FreeSeatRow({ title, hint, waiting = false }: FreeSeatRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 68,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: colors.line,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {waiting ? (
          <Spinner color={colors.muted} size={20} strokeWidth={2.4} />
        ) : (
          <Icon name={IconName.Plus} color={colors.muted} size={20} strokeWidth={2} />
        )}
      </View>
      <View style={{ gap: 2, flex: 1 }}>
        <Text variant={TextVariant.Body} weight={500}>
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
