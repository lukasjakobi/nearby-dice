const { withAppBuildGradle } = require('expo/config-plugins');

const START = '// @generated begin nearby-dice-release-signing';
const END = '// @generated end nearby-dice-release-signing';

// Credentials stay in the build environment. EAS can populate the same release
// signing configuration after this block; validation observes its final values.
const SIGNING = `
android {
    signingConfigs {
        release {
            def keystorePath = System.getenv('NEARBY_DICE_RELEASE_STORE_FILE')
            if (keystorePath) {
                storeFile rootProject.file(keystorePath)
                storePassword System.getenv('NEARBY_DICE_RELEASE_STORE_PASSWORD')
                keyAlias System.getenv('NEARBY_DICE_RELEASE_KEY_ALIAS')
                keyPassword System.getenv('NEARBY_DICE_RELEASE_KEY_PASSWORD')
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

tasks.configureEach { task ->
    if (task.name ==~ /validateSigning.*Release/) {
        task.doFirst {
            def signing = android.buildTypes.release.signingConfig
            def debugSigning = android.signingConfigs.debug
            if (signing == null || signing == debugSigning || signing.storeFile == null ||
                signing.storeFile.canonicalFile == debugSigning.storeFile?.canonicalFile ||
                signing.storeFile.name == 'debug.keystore' || signing.keyAlias == 'androiddebugkey' ||
                !signing.storePassword || !signing.keyAlias || !signing.keyPassword) {
                throw new GradleException('Release signing requires a production keystore. Configure NEARBY_DICE_RELEASE_STORE_FILE, NEARBY_DICE_RELEASE_STORE_PASSWORD, NEARBY_DICE_RELEASE_KEY_ALIAS and NEARBY_DICE_RELEASE_KEY_PASSWORD, or managed build signing credentials.')
            }
        }
    }
}
`;

function configureReleaseSigning(contents) {
  const start = contents.indexOf(START);
  const end = contents.indexOf(END);
  if (
    (start === -1) !== (end === -1) ||
    (start !== -1 &&
      (end < start ||
        contents.indexOf(START, start + START.length) !== -1 ||
        contents.indexOf(END, end + END.length) !== -1))
  ) {
    throw new Error('Malformed generated release signing block');
  }

  const base =
    start === -1 ? contents : contents.slice(0, start) + contents.slice(end + END.length);
  const withoutDevelopmentSigning = base.replace(
    /(\brelease\s*\{[^{}]*?)\bsigningConfig\s+(?:android\.)?signingConfigs\.(?:debug|release)\b/g,
    '$1',
  );

  // The appended block declares release signing before assigning it to the build type.
  return `${withoutDevelopmentSigning.trimEnd()}\n\n${START}\n${SIGNING.trim()}\n${END}\n`;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('Nearby Dice release signing requires a Groovy app build.gradle');
    }

    mod.modResults.contents = configureReleaseSigning(mod.modResults.contents);

    return mod;
  });
}

module.exports = withReleaseSigning;
module.exports.configureReleaseSigning = configureReleaseSigning;
