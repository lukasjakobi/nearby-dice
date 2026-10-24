import { View } from 'react-native';

import { Card, FadeIn, Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

type HostErrorCardProps = { error: { title: string; body: string } };

/** The danger card above the "Lobby öffnen" button when opening the round failed. */
export function HostErrorCard({ error }: HostErrorCardProps) {
  const { colors } = useTheme();

  return (
    <FadeIn>
      <Card border="danger" radius={14} style={{ gap: 6, borderWidth: 1.5 }}>
        <View
          accessibilityRole="alert"
          style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
        >
          <Icon name={IconName.Warning} color={colors.danger} size={20} />
          <Text variant={TextVariant.BodyStrong} size={15} color="danger">
            {error.title}
          </Text>
        </View>
        <Text variant={TextVariant.Caption} color="muted">
          {error.body}
        </Text>
      </Card>
    </FadeIn>
  );
}
