// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const { fixupConfigRules } = require('@eslint/compat');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const stylistic = require('@stylistic/eslint-plugin');

/** Other modules are reached only through their barrel (`@/domain`, `@/features/game`, …). */
const BARRELS_ONLY = {
  patterns: [
    {
      group: ['domain', 'session', 'net', 'store', 'lib', 'ui', 'i18n', 'shared'].map(
        (module) => `@/${module}/**`,
      ),
      message: 'Import from the module barrel (e.g. `@/domain`), not a file inside it.',
    },
    {
      group: ['@/features/*/**'],
      message: 'Import a feature through its barrel (`@/features/<name>`).',
    },
    {
      group: ['../../*', '../../**'],
      message: 'Leave the module through `@/…` barrels instead of deep relative paths.',
    },
  ],
};

/**
 * Dependencies point downwards only (docs/technical-design.md, Layers): each module lists the
 * modules it may import. Only `net` reaches the native Nearby bridge; `domain` uses no packages.
 */
const MAY_IMPORT = {
  app: ['features'],
  features: ['features', 'shared', 'session', 'store', 'i18n', 'ui', 'net', 'domain', 'lib'],
  shared: ['session', 'store', 'i18n', 'ui', 'net', 'domain', 'lib'],
  i18n: ['session', 'store', 'domain'],
  session: ['net', 'domain', 'lib'],
  store: ['domain', 'lib'],
  ui: ['domain'], // player colours in theme tokens
  net: ['domain', 'lib'],
  domain: [],
  lib: [],
};

/**
 * `../../` is banned everywhere, so only a file at a module's root can leave it with `../`, and
 * that path skips the barrel and layer checks, which see only `@/…` strings.
 */
const STAY_IN_MODULE = {
  group: ['../*', '../**'],
  message: 'Leave the module through `@/…` barrels, not `../`.',
};

/** Files at a module's root; a feature is its own module. */
const moduleRootFiles = (layer) =>
  layer === 'features'
    ? ['src/features/*.{ts,tsx}', 'src/features/*/*.{ts,tsx}']
    : [`src/${layer}/*.{ts,tsx}`];

const layerRule = (layer, extraPatterns = []) => {
  const allowed = MAY_IMPORT[layer];
  const forbidden = Object.keys(MAY_IMPORT).filter(
    (other) => other !== layer && !allowed.includes(other),
  );
  const reach = allowed.length > 0 ? `may import only ${allowed.join(', ')}` : 'imports nothing';
  const patterns = [
    ...BARRELS_ONLY.patterns,
    ...extraPatterns,
    {
      group: forbidden.map((module) => `@/${module}`),
      message: `\`${layer}\` ${reach} (see docs/technical-design.md, Layers).`,
    },
  ];
  if (layer !== 'net') {
    patterns.push({
      group: ['@modules/*'],
      message: 'Only `net` talks to the native Nearby bridge.',
    });
  }

  if (layer === 'domain') {
    patterns.push({
      regex: '^(?!\\.|@/|@modules/)',
      message: '`domain` stays pure: no React, Expo or other packages.',
    });
  }

  return ['error', { patterns }];
};

module.exports = defineConfig([
  // Expo’s React/import plugins still use context methods removed in ESLint 10.
  ...fixupConfigRules(expoConfig),
  prettierConfig,
  {
    // Prettier keeps blank lines but never adds them. A blank line before `return` and after a
    // block marks where one step ends.
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', BARRELS_ONLY] },
  },
  ...Object.keys(MAY_IMPORT).map((layer) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': layerRule(layer) },
  })),
  // Repeats the layer rule because a later `no-restricted-imports` replaces the earlier options.
  ...Object.keys(MAY_IMPORT).map((layer) => ({
    files: moduleRootFiles(layer),
    rules: { 'no-restricted-imports': layerRule(layer, [STAY_IN_MODULE]) },
  })),
  {
    // Tests exercise module internals directly.
    files: ['src/**/__tests__/**', 'src/test/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // An unawaited render/unmount/act overlaps the next act() and keeps Jest from exiting.
    files: [
      'src/**/__tests__/**/*.{ts,tsx}',
      'modules/**/__tests__/**/*.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
    ],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    rules: { '@typescript-eslint/no-floating-promises': 'error' },
  },
  {
    ignores: ['dist/*', 'ios/*', 'android/*', 'coverage/*'],
  },
]);
