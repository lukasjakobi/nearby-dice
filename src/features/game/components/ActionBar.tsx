import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Bob,
  Button,
  ButtonVariant,
  DieFace,
  FIXED,
  IconName,
  RADIUS,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';

import { ControlKind } from '../view';
import type { ControlView, DieView } from '../view';
import { RollButton } from './RollButton';
import { RollCounter } from './RollCounter';
import { RollHint } from './RollHint';
import { ROLL_TILE_HEIGHT, ROLL_TILE_RADIUS } from './rollTile';
import { SlideButton, SlideTone } from './SlideButton';
import { TimerBar } from './TimerBar';
import type { Timer } from './TimerBar';

const TILTS = [-3, 2, -2, 3, -2];
/**
 * Before the first roll the dice float on the felt showing these faces: no pair and no run,
 * so they never look like a scored result.
 */
const RESTING_FACES = [3, 6, 1, 5, 2];
/** Each die floats a little behind its neighbour, so the row ripples. */
const FLOAT_STAGGER_MS = 180;
const BAR_PADDING = 16;
const DICE_GAP = 6;

type ActionBarProps = {
  dice: DieView[];
  shakeKeys: number[];
  control: ControlView;
  timer: Timer | null;
  onToggleHold: (die: number) => void;
  onRoll: () => void;
  /** "Zum Würfeln wischen": rolling and entering a score take a slide; off, a tap. */
  swipeToRoll: boolean;
  confirm: { label: string; points: string; strike: boolean; sending: boolean } | null;
  onConfirm: () => void;
};

/** The felt bar at the bottom edge: time bar, five dice, the roll control or score controls. */
export function ActionBar({
  dice,
  shakeKeys,
  control,
  timer,
  onToggleHold,
  onRoll,
  swipeToRoll,
  confirm,
  onConfirm,
}: ActionBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const diceWidth = width - 2 * BAR_PADDING - DICE_GAP * (dice.length - 1);
  const dieSize = Math.min(64, Math.floor(diceWidth / dice.length));
  const locked = dice.some((die) => die.locked);
  // While the dice are in the air the roll control stays as it is (rolls are ignored upstream)
  // instead of flickering to the hint on every roll.
  const rollsUsedUp = control.kind === ControlKind.MyTurn && !control.canRoll && !control.rollBusy;

  return (
    <View style={[styles.bar, { backgroundColor: colors.felt, paddingBottom: 16 + insets.bottom }]}>
      {timer ? <TimerBar {...timer} /> : null}

      {/* With a field selected the dice straighten into a framed row: this is what gets
          scored, nothing is rolled again. */}
      <View
        style={[
          styles.dice,
          locked && styles.diceLocked,
          control.kind === ControlKind.Waiting && styles.diceWatched,
        ]}
        accessibilityRole="none"
        accessibilityLabel={locked ? t('game.diceLocked') : t('game.dice')}
      >
        {dice.map((die, i) => {
          const unrolled = die.value === 0;

          return (
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
              <Bob active={unrolled} distance={3} delayMs={i * FLOAT_STAGGER_MS}>
                <DieFace
                  value={unrolled ? RESTING_FACES[i] : die.value}
                  size={dieSize}
                  held={die.held && !die.locked}
                  tilt={die.locked ? 0 : TILTS[i]}
                  shakeKey={shakeKeys[i]}
                />
              </Bob>
            </Pressable>
          );
        })}
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
            {confirm && swipeToRoll ? (
              <SlideButton
                label={confirm.strike ? t('game.confirm.strike') : t('game.confirm.enter')}
                icon={IconName.Check}
                tone={SlideTone.Confirm}
                onCommit={onConfirm}
                busy={confirm.sending}
                accessibilityHint={`${confirm.label}: ${confirm.points}`}
                style={styles.control}
              />
            ) : confirm ? (
              <Button
                label={confirm.strike ? t('game.confirm.strike') : t('game.confirm.enter')}
                onPress={onConfirm}
                loading={confirm.sending}
                accessibilityHint={`${confirm.label}: ${confirm.points}`}
                icon={IconName.Check}
                variant={ButtonVariant.Accent}
                height={ROLL_TILE_HEIGHT}
                style={[styles.control, styles.confirmButton]}
              />
            ) : rollsUsedUp ? (
              <RollHint label={control.rollLabel} style={styles.control} />
            ) : swipeToRoll ? (
              <SlideButton
                label={control.rollLabel}
                icon={IconName.Dice}
                tone={SlideTone.Roll}
                onCommit={onRoll}
                style={styles.control}
              />
            ) : (
              <RollButton label={control.rollLabel} onRoll={onRoll} style={styles.control} />
            )}
          </>
        ) : (
          // Same counter as on my turn; the status takes the roll control's place.
          <>
            <RollCounter rolls={control} />
            <View style={styles.waiting} accessibilityLiveRegion="polite">
              <View style={[styles.turnAvatar, !control.busy && styles.turnAvatarAway]}>
                <Avatar initial={control.avatar.initial} color={control.avatar.color} size={30} />
              </View>
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
    borderTopLeftRadius: RADIUS.chip,
    borderTopRightRadius: RADIUS.chip,
    paddingTop: 12,
    paddingHorizontal: BAR_PADDING,
    gap: 10,
    borderTopWidth: 3,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  diePressed: { transform: [{ scale: 0.9 }], opacity: 0.85 },
  // The frame sits in the negative margin, so the dice do not move when it appears.
  dice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DICE_GAP,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 6.5,
    marginHorizontal: -8,
    marginBottom: -6,
    borderRadius: RADIUS.chip,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  diceLocked: { borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.07)' },
  // Someone else's dice: shown live, but plainly not mine to touch.
  diceWatched: { opacity: 0.72 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 48,
  },
  selection: { flexShrink: 1, gap: 4 },
  // Every control on the right (slide, tap button, hint) takes the same fixed share of the row,
  // so its edge stays put while the text on the left changes ("3 Würfe übrig" → "Fünfer").
  control: { width: '60%' },
  confirmButton: { borderRadius: ROLL_TILE_RADIUS },
  waiting: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  waitingText: { flexShrink: 1 },
  turnAvatar: { borderRadius: 999, borderWidth: 2, borderColor: FIXED.onFelt, padding: 1 },
  turnAvatarAway: { opacity: 0.45 },
});
