import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Avatar,
  FadeIn,
  IconButton,
  IconName,
  SIZE,
  Spinner,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';

import type { NearbyRoundView } from '../hooks';

type NearbyRoundsProps = {
  rounds: NearbyRoundView[];
  scanning: boolean;
  onJoin: (round: NearbyRoundView) => void;
  onRefresh: () => void;
  error: boolean;
};

/** "In deiner Nähe": skeletons while scanning, rows as rounds appear, empty text at the end. */
export function NearbyRounds({ rounds, scanning, onJoin, onRefresh, error }: NearbyRoundsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, minHeight: 0, gap: 10 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: SIZE.iconButton }}
      >
        <Text variant={TextVariant.CardTitle} accessibilityRole="header">
          {t('join.nearbyTitle')}
        </Text>
        {scanning ? (
          <Spinner color={colors.primary} size={16} strokeWidth={3} label={t('join.scanning')} />
        ) : null}
        <IconButton
          icon={IconName.Refresh}
          label={t('join.refresh')}
          onPress={onRefresh}
          disabled={scanning}
          color="primary"
          style={{ marginLeft: 'auto' }}
        />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 8 }}>
        {scanning && rounds.length === 0 ? (
          <View accessibilityState={{ busy: true }} style={{ gap: 8 }}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: colors.surface2,
                  opacity: 0.7,
                }}
              />
            ))}
          </View>
        ) : null}
        {!scanning && rounds.length === 0 ? (
          <Text
            variant={TextVariant.Body}
            color={error ? 'danger' : 'muted'}
            accessibilityRole={error ? 'alert' : undefined}
            align="center"
            style={{ paddingVertical: 20 }}
          >
            {error ? t('join.scanFailed') : t('join.nearbyEmpty')}
          </Text>
        ) : null}
        {rounds.map((round) => (
          <FadeIn key={round.endpointId}>
            <Pressable
              onPress={() => onJoin(round)}
              disabled={round.full}
              accessibilityRole="button"
              accessibilityLabel={t(round.full ? 'join.roundA11yFull' : 'join.roundA11y', {
                name: round.roundName,
                n: round.players,
                max: round.maxPlayers,
              })}
              accessibilityState={{ disabled: round.full }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 64,
                paddingVertical: 8,
                paddingLeft: 10,
                paddingRight: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.line,
                backgroundColor: colors.surface,
                opacity: round.full ? 0.55 : 1,
              }}
            >
              <Avatar initial={round.initial} color={round.color} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant={TextVariant.BodyStrong} numberOfLines={1}>
                  {round.roundName}
                </Text>
                <Text variant={TextVariant.Caption} color="muted">
                  {t('join.seats', { n: round.players, max: round.maxPlayers })}
                </Text>
              </View>
              <Text variant={TextVariant.Label} color={round.full ? 'muted' : 'primary'}>
                {round.full ? t('join.full') : t('join.join')}
              </Text>
            </Pressable>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}
