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
        changed: PRESETS[preset].luckyNumber,
      },
    ]);
  },
);

test.each([
  [PresetId.ClassicXl, 17],
  [PresetId.LuckyNumber, 14],
])('%s summary marks its turn count as changed from the classic game', (preset, turns) => {
  expect(rulesSummary(t, preset)).toEqual(
    expect.arrayContaining([
      { label: t('lobby.rules.rounds'), value: String(turns), changed: true },
    ]),
  );
});

test('the classic summary changes nothing and leaves the mode to the sheet title', () => {
  const lines = rulesSummary(t, PresetId.Classic);

  expect(lines.every((line) => !line.changed)).toBe(true);
  expect(lines.map((line) => line.label)).not.toContain(t('lobby.rules.style'));
});

test.each(PRESET_ORDER)('%s summary leaves out rules every preset shares', (preset) => {
  const labels = rulesSummary(t, preset).map((line) => line.label);

  // Labels are checked as literal text: the keys are gone, so a `t()` lookup would not catch a regression.
  expect(labels).not.toContain('Rolls per turn');
  expect(labels).not.toContain('Bonus from 63 points');
});

test.each(PRESET_ORDER)('%s summary has no joker or extra-Yatzy line', (preset) => {
  const labels = rulesSummary(t, preset).map((line) => line.label);

  // The further-Yatzy rule is the same in every mode, so the summary does not list it.
  expect(labels).not.toContain('Joker');
  expect(labels).not.toContain('Weitere Yatzy');
});
