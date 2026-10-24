import { PRESET_ORDER, PRESETS, PresetId } from '@/domain/rules';
import { t } from '@/test/i18n';

import { rulesSummary } from '../view/rulesSummary';

test.each([PresetId.Classic, PresetId.Yatzy, PresetId.ClassicXl, PresetId.LuckyNumber])(
  '%s summary includes the lucky-number switch',
  (preset) => {
    const lines = rulesSummary(t, preset);
    expect(lines.filter((line) => line.label === t('lobby.rules.luckyNumber'))).toEqual([
      {
        label: t('lobby.rules.luckyNumber'),
        value: PRESETS[preset].luckyNumber ? t('lobby.rules.on') : t('lobby.rules.off'),
      },
    ]);
  },
);

test.each([
  [PresetId.ClassicXl, 17],
  [PresetId.LuckyNumber, 14],
])('%s summary names the preset and its turn count', (preset, turns) => {
  expect(rulesSummary(t, preset)).toEqual(
    expect.arrayContaining([
      { label: t('lobby.rules.style'), value: t(`labels.preset.${preset}.title`) },
      { label: t('lobby.rules.rounds'), value: String(turns) },
    ]),
  );
});

test.each(PRESET_ORDER)('%s summary has no joker or extra-Yatzy line', (preset) => {
  const labels = rulesSummary(t, preset).map((line) => line.label);

  // The further-Yatzy rule is the same in every mode, so the summary does not list it.
  expect(labels).not.toContain('Joker');
  expect(labels).not.toContain('Weitere Yatzy');
});
