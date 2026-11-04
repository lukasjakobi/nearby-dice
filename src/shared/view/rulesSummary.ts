import { PRESETS, PresetId, turnsPerPlayer } from '@/domain';
import type { TFunction } from '@/i18n';

export type RuleLine = {
  label: string;
  value: string;
  /** Differs from the classic game: the sheet makes it stand out. */
  changed: boolean;
};

/**
 * The read-only "Regeln der Runde" list: only the options that differ between presets. Rules that
 * every preset shares (three rolls, the upper bonus, a random start) are left out, since no choice
 * changes them, and so is the mode itself, which heads the sheet, with a ruleset of the same name.
 */
export function rulesSummary(t: TFunction, preset: PresetId): RuleLine[] {
  const rules = PRESETS[preset];
  const classic = PRESETS[PresetId.Classic];
  const onOff = (on: boolean) => (on ? t('lobby.rules.on') : t('lobby.rules.off'));
  const line = (label: string, value: string, classicValue: string): RuleLine => ({
    label,
    value,
    changed: value !== classicValue,
  });

  const ruleset = t(`labels.ruleset.${rules.ruleset}`);
  // "Spielblock: Klassisch" under the mode "Klassisch" would only repeat the sheet's title.
  const namedLikeMode = ruleset === t(`labels.preset.${preset}.title`);

  return [
    ...(namedLikeMode
      ? []
      : [line(t('lobby.rules.ruleset'), ruleset, t(`labels.ruleset.${classic.ruleset}`))]),
    line(t('lobby.rules.rounds'), String(turnsPerPlayer(rules)), String(turnsPerPlayer(classic))),
    line(
      t('lobby.rules.sheets'),
      t(`labels.sheetCount.${rules.sheets}`),
      t(`labels.sheetCount.${classic.sheets}`),
    ),
    line(
      t('lobby.rules.time'),
      t(`labels.secondsPerTurn.${rules.secondsPerTurn}`),
      t(`labels.secondsPerTurn.${classic.secondsPerTurn}`),
    ),
    line(
      t('lobby.rules.order'),
      t(`labels.fieldOrder.${rules.fieldOrder}`),
      t(`labels.fieldOrder.${classic.fieldOrder}`),
    ),
    line(t('lobby.rules.sameDice'), onOff(rules.sameDice), onOff(classic.sameDice)),
    line(t('lobby.rules.luckyNumber'), onOff(rules.luckyNumber), onOff(classic.luckyNumber)),
  ];
}
