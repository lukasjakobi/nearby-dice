import { PRESETS, UPPER_BONUS_THRESHOLD, turnsPerPlayer, upperBonusPoints } from '@/domain';
import type { PresetId } from '@/domain';
import type { TFunction } from '@/i18n';

export type RuleLine = { label: string; value: string };

/** The read-only "Regeln der Runde" list: every option of the preset that changes how it plays. */
export function rulesSummary(t: TFunction, preset: PresetId): RuleLine[] {
  const rules = PRESETS[preset];
  const lines: RuleLine[] = [
    { label: t('lobby.rules.style'), value: t(`labels.preset.${preset}.title`) },
    { label: t('lobby.rules.ruleset'), value: t(`labels.ruleset.${rules.ruleset}`) },
    { label: t('lobby.rules.rounds'), value: String(turnsPerPlayer(rules)) },
    { label: t('lobby.rules.sheets'), value: t(`labels.sheetCount.${rules.sheets}`) },
    { label: t('lobby.rules.rolls'), value: String(rules.rollsPerTurn) },
    { label: t('lobby.rules.time'), value: t(`labels.secondsPerTurn.${rules.secondsPerTurn}`) },
    { label: t('lobby.rules.order'), value: t(`labels.fieldOrder.${rules.fieldOrder}`) },
    {
      label: t('lobby.rules.sameDice'),
      value: rules.sameDice ? t('lobby.rules.on') : t('lobby.rules.off'),
    },
    {
      label: t('lobby.rules.luckyNumber'),
      value: rules.luckyNumber ? t('lobby.rules.on') : t('lobby.rules.off'),
    },
    {
      label: t('lobby.rules.upperBonus', { threshold: UPPER_BONUS_THRESHOLD }),
      value: rules.upperBonus ? `+${upperBonusPoints(rules.ruleset)}` : t('lobby.rules.off'),
    },
  ];

  return lines;
}
