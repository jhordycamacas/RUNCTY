const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// with-short-cxx-dir';

/**
 * Windows only: moves the CMake staging directory (normally android/app/.cxx)
 * to a short folder at the drive root (e.g. D:\.rcx).
 *
 * The native codegen paths of React Native libraries are long, and the ninja
 * shipped with the Android SDK cannot create folders past the Windows MAX_PATH
 * limit, so the build fails with "Filename longer than 260 characters" or
 * "mkdir(...): No such file or directory".
 * See docs/manual-instalacion-android.md, section 10.
 */
const withShortCxxDir = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;

    const snippet = `android {
    ${MARKER}
    if (System.getProperty('os.name').toLowerCase().contains('windows')) {
        externalNativeBuild {
            cmake {
                buildStagingDirectory = new File(rootDir.toPath().getRoot().toString(), '.rcx')
            }
        }
    }
`;
    cfg.modResults.contents = cfg.modResults.contents.replace(/^android \{\n/m, snippet);
    return cfg;
  });

module.exports = withShortCxxDir;
