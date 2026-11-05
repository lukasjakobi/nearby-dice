import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar, Button, ButtonVariant, FadeIn, Text, TextVariant, useTheme } from '@/ui';

import type { NearbyRoundView } from '../hooks';
import { ScanPulse } from './ScanPulse';

type NearbyRoundsProps = {
  rounds: NearbyRoundView[];
  onJoin: (round: NearbyRoundView) => void;
  /** Restarts a search that failed. */
  onRetry: () => void;
  error: boolean;
};

/**
 * "In deiner Nähe": a radar until rounds appear, then a row per round. The search runs as long as
 * the screen is open, so the radar stays instead of an empty state; only an error replaces it,
 * with a way to search again.
 */
export function NearbyRounds({ rounds, onJoin, onRetry, error }: NearbyRoundsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, minHeight: 0, gap: 10 }}>
      <Text variant={TextVariant.CardTitle} accessibilityRole="header">
        {t('join.nearbyTitle')}
      </Text>
      <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 8 }}>
        {/* The search never ends while this screen is open, so there is no "nothing found". */}
        {rounds.length === 0 && !error ? <ScanPulse label={t('join.scanning')} /> : null}
        {rounds.length === 0 && error ? (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}>
            <Text
              variant={TextVariant.Body}
              color="danger"
              accessibilityRole="alert"
              align="center"
            >
              {t('join.scanFailed')}
            </Text>
            <Button
              label={t('join.retry')}
              onPress={onRetry}
              variant={ButtonVariant.Tonal}
              height={44}
            />
          </View>
        ) : null}
        {rounds.map((round) => (
          <FadeIn key={round.endpointId}>
            <Pressable
              onPress={() => onJoin(round)}
              disabled={round.full}
              accessibilityRole="button"
              accessibilityLabel={t(round.full ? 'join.roundA11yFull' : 'join.roundA11y', {
                name: round.hostName,
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
                  {round.hostName}
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
