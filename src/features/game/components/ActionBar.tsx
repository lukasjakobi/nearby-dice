import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonVariant, DieFace, FIXED, Spinner, Text, TextVariant, useTheme } from '@/ui';

import { ControlKind } from '../view';
import type { ControlView, DieView } from '../view';
import { RollCounter } from './RollCounter';
import { TimerBar } from './TimerBar';
import type { Timer } from './TimerBar';

const TILTS = [-3, 2, -2, 3, -2];

type ActionBarProps = {
  dice: DieView[];
  shakeKeys: number[];
  control: ControlView;
  timer: Timer | null;
  onToggleHold: (die: number) => void;
  onRoll: () => void;
  confirm: { label: string; points: string; strike: boolean; sending: boolean } | null;
  onConfirm: () => void;
};

/** The felt bar at the bottom edge: time bar, five dice, roll or score controls. */
export function ActionBar({
  dice,
  shakeKeys,
  control,
  timer,
  onToggleHold,
  onRoll,
  confirm,
  onConfirm,
}: ActionBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const locked = dice.some((die) => die.locked);

  return (
    <View style={[styles.bar, { backgroundColor: colors.felt, paddingBottom: 16 + insets.bottom }]}>
      {timer ? <TimerBar {...timer} /> : null}

      {/* With a field selected the dice straighten into a framed row: this is what gets
          scored, nothing is rolled again. */}
      <View
        style={[styles.dice, locked && styles.diceLocked]}
        accessibilityRole="none"
        accessibilityLabel={locked ? t('game.diceLocked') : t('game.dice')}
      >
        {dice.map((die, i) => (
          <Pressable
            key={i}
            onPress={() => onToggleHold(i)}
            disabled={!die.canToggle}
            accessibilityRole="button"
            accessibilityLabel={die.label}
            accessibilityState={{ selected: die.held, disabled: !die.canToggle }}
            hitSlop={{ top: 10, bottom: 6, left: 2, right: 2 }}
            style={({ pressed }) => pressed && styles.diePressed}
          >
            <DieFace
              value={die.value}
              size={58}
              held={die.held && !die.locked}
              tilt={die.locked ? 0 : TILTS[i]}
              shakeKey={shakeKeys[i]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        {control.kind === ControlKind.MyTurn ? (
          <>
            {confirm ? (
              <View style={styles.selection} accessibilityLiveRegion="polite">
                <Text size={15} weight={600} color={{ raw: FIXED.onFelt }}>
                  {confirm.label}
                </Text>
                <Text size={13} color={{ raw: FIXED.onFelt }}>
                  {confirm.points}
                </Text>
              </View>
            ) : (
              <RollCounter rolls={control} />
            )}
            <Button
              label={
                confirm
                  ? confirm.strike
                    ? t('game.confirm.strike')
                    : t('game.confirm.enter')
                  : control.rollLabel
              }
              onPress={confirm ? onConfirm : onRoll}
              // While the dice are in the air the button stays as it is (presses are
              // ignored upstream) instead of dimming for a moment on every roll.
              disabled={!confirm && !control.canRoll && !control.rollBusy}
              loading={!!confirm?.sending}
              accessibilityHint={confirm ? `${confirm.label}: ${confirm.points}` : undefined}
              variant={ButtonVariant.Accent}
              height={48}
              style={styles.rollButton}
            />
          </>
        ) : (
          // Same counter as on my turn; the status takes the roll button's place.
          <>
            <RollCounter rolls={control} />
            <View style={styles.waiting} accessibilityLiveRegion="polite">
              {control.busy ? <Spinner color={FIXED.onFelt} size={20} /> : null}
              <Text
                variant={TextVariant.Body}
                size={16}
                weight={500}
                color={{ raw: FIXED.onFelt }}
                numberOfLines={2}
                style={styles.waitingText}
              >
                {control.text}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderTopWidth: 3,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  diePressed: { transform: [{ scale: 0.9 }], opacity: 0.85 },
  // The frame sits in the negative margin, so the dice do not move when it appears.
  dice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 6.5,
    marginHorizontal: -8,
    marginBottom: -6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  diceLocked: { borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.07)' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 48,
  },
  selection: { flexShrink: 1, gap: 4 },
  rollButton: { flex: 1, paddingHorizontal: 28 },
  waiting: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  waitingText: { flexShrink: 1 },
});
