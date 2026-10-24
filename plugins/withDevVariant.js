const fs = require('fs');
const path = require('path');
const { withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');

const MARKER = '// @generated nearby-dice-dev-variant';
const SUFFIX = `applicationIdSuffix '.dev' ${MARKER}`;

const DEBUG_STRINGS = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="app_name">Nearby Dice Dev</string>
</resources>
`;

function depthBetween(contents, from, to) {
  let depth = 0;
  for (let i = from; i < to; i += 1) {
    if (contents[i] === '{') depth += 1;
    if (contents[i] === '}') depth -= 1;
  }

  return depth;
}

// Finds `name { ... }` directly inside [from, to) and returns its brace positions.
function findBlock(contents, name, from, to) {
  const pattern = new RegExp(`\\b${name}\\s*\\{`, 'g');
  pattern.lastIndex = from;
  let match;
  while ((match = pattern.exec(contents)) !== null && match.index < to) {
    if (depthBetween(contents, from, match.index) === 0) {
      const open = match.index + match[0].length - 1;

      return { match: match.index, open, close: closingBrace(contents, open) };
    }
  }

  return null;
}

function closingBrace(contents, open) {
  let depth = 0;
  for (let i = open; i < contents.length; i += 1) {
    if (contents[i] === '{') depth += 1;
    if (contents[i] === '}') depth -= 1;
    if (depth === 0) return i;
  }

  throw new Error('Unbalanced braces in app build.gradle');
}

function configureDevVariant(contents) {
  // Drop any previously generated line so repeated runs produce the same output.
  const base = contents
    .split('\n')
    .filter((line) => !line.includes(MARKER))
    .join('\n');
  const android = findBlock(base, 'android', 0, base.length);
  const buildTypes = android && findBlock(base, 'buildTypes', android.open + 1, android.close);
  if (!buildTypes) {
    throw new Error('Nearby Dice dev variant requires a buildTypes block in app build.gradle');
  }

  const debug = findBlock(base, 'debug', buildTypes.open + 1, buildTypes.close);
  if (!debug) {
    throw new Error('Nearby Dice dev variant requires a debug build type in app build.gradle');
  }

  if (/applicationIdSuffix/.test(base.slice(debug.open, debug.close))) {
    throw new Error('Unexpected applicationIdSuffix in the debug build type');
  }

  const lineStart = base.lastIndexOf('\n', debug.match) + 1;
  const indent = base.slice(lineStart, debug.match).match(/^\s*/)[0];

  return `${base.slice(0, debug.open + 1)}\n${indent}    ${SUFFIX}${base.slice(debug.open + 1)}`;
}

function withDevVariant(config) {
  const withSuffix = withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('Nearby Dice dev variant requires a Groovy app build.gradle');
    }

    mod.modResults.contents = configureDevVariant(mod.modResults.contents);

    return mod;
  });

  return withDangerousMod(withSuffix, [
    'android',
    (mod) => {
      const dir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'debug',
        'res',
        'values',
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'strings.xml'), DEBUG_STRINGS);

      return mod;
    },
  ]);
}

module.exports = withDevVariant;
module.exports.configureDevVariant = configureDevVariant;
