import { Category, FieldOrder, Joker, NameProblem, PlayerColor, PresetId, Ruleset } from '@/domain';
import { EndReason, HostError, JoinError, JoinStep, RematchVote } from '@/session';
import { LanguageMode, ThemeMode } from '@/store';

import { i18n, Locale, localeFor } from '..';
import de from '../locales/de.json';
import en from '../locales/en.json';

const NBSP = ' ';
const german = i18n.getFixedT(Locale.German);
const english = i18n.getFixedT(Locale.English);

function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' ? keys(value as object, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

test('a chosen language wins over the device languages', () => {
  expect(localeFor(LanguageMode.German, ['en'])).toBe(Locale.German);
  expect(localeFor(LanguageMode.English, ['de'])).toBe(Locale.English);
});

test('"System" takes the first device language with a catalog, else English', () => {
  expect(localeFor(LanguageMode.System, ['fr', null, 'de'])).toBe(Locale.German);
  expect(localeFor(LanguageMode.System, ['en', 'de'])).toBe(Locale.English);
  expect(localeFor(LanguageMode.System, ['fr', 'pl'])).toBe(Locale.English);
});

test('both catalogs have the same keys', () => {
  expect(keys(en).sort()).toEqual(keys(de).sort());
});

test.each([
  ['category', Category],
  ['playerColor', PlayerColor],
  ['ruleset', Ruleset],
  ['joker', Joker],
  ['fieldOrder', FieldOrder],
  ['themeMode', ThemeMode],
  ['languageMode', LanguageMode],
  ['nameProblem', NameProblem],
  ['joinStep', JoinStep],
])('every %s has a label', (group, values) => {
  for (const value of Object.values(values)) {
    expect(i18n.exists(`labels.${group}.${value}`, { lng: Locale.German })).toBe(true);
  }
});

test('every preset, error and vote state has its text', () => {
  const required = [
    ...Object.values(PresetId).map((id) => `labels.preset.${id}.title`),
    ...Object.values(JoinError).map((error) => `errors.join.${error}.title`),
    ...Object.values(HostError).map((error) => `errors.host.${error}.title`),
    ...Object.values(EndReason)
      .filter((reason) => reason !== EndReason.Left)
      .map((reason) => `errors.sessionEnd.${reason}.title`),
    ...Object.values(RematchVote).map((vote) => `results.voteState.${vote}`),
  ];
  for (const key of required) expect(i18n.exists(key, { lng: Locale.German })).toBe(true);
});

test('possessives and name lists follow each language', () => {
  expect(german('game.sheetOf', { name: 'Jonas' })).toBe('Jonas’ Blatt');
  expect(german('game.sheetOf', { name: 'Antonia' })).toBe('Antonias Blatt');
  expect(english('game.sheetOf', { name: 'Antonia' })).toBe('Antonia’s sheet');
  expect(english('game.isUp', { name: 'Jonas' })).toBe('Jonas’ turn');
  const body = english('home.resume.body', {
    round: 3,
    total: 13,
    others: ['Antonia', 'Jonas', 'Elif'],
    host: 'Elif',
    since: 'just now',
  });
  expect(body).toContain('with Antonia, Jonas and Elif.');
});

test('plurals, the zero case and nested points', () => {
  expect(german('game.rollsLeft', { count: 0 })).toBe('Kein Wurf übrig');
  expect(german('game.rollsLeft', { count: 1 })).toBe(`1${NBSP}Wurf übrig`);
  expect(english('game.rollsLeft', { count: 2 })).toBe(`2${NBSP}rolls left`);
  expect(german('game.cell.filled', { label: 'Chance', count: 1 })).toBe(
    `Chance: 1${NBSP}Punkt, eingetragen`,
  );
  expect(english('errors.sessionEnd.kicked.title')).toBe('You were removed');
});
