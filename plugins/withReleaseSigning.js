const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'MOTORISTA_KEYSTORE';

const RELEASE_SIGNING = `signingConfigs {
        release {
            if (System.getenv('MOTORISTA_KEYSTORE')) {
                storeFile file(System.getenv('MOTORISTA_KEYSTORE'))
                storePassword System.getenv('MOTORISTA_KEYSTORE_PASSWORD')
                keyAlias System.getenv('MOTORISTA_KEY_ALIAS') ?: 'motorista'
                keyPassword System.getenv('MOTORISTA_KEYSTORE_PASSWORD')
            }
        }`;

const RELEASE_BUILD_TYPE = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;

function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;
  if (!RELEASE_BUILD_TYPE.test(gradle)) throw new Error('withReleaseSigning: bloco release do build.gradle não encontrado');
  const withBuildType = gradle.replace(
    RELEASE_BUILD_TYPE,
    "$1signingConfig System.getenv('MOTORISTA_KEYSTORE') ? signingConfigs.release : signingConfigs.debug",
  );
  return withBuildType.replace('signingConfigs {', RELEASE_SIGNING);
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    gradleConfig.modResults.contents = addReleaseSigning(gradleConfig.modResults.contents);
    return gradleConfig;
  });
};

module.exports.addReleaseSigning = addReleaseSigning;
