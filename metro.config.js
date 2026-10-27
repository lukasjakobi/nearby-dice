// https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/** The web build (browser harness) resolves `react-native` to a shim over react-native-web. */
const WEB_REACT_NATIVE = path.resolve(__dirname, 'web/react-native.js');
/** babel-preset-expo already rewrites `react-native` imports to this path for web. */
const REACT_NATIVE_IMPORTS = ['react-native', 'react-native-web', 'react-native-web/dist/index'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    REACT_NATIVE_IMPORTS.includes(moduleName) &&
    context.originModulePath !== WEB_REACT_NATIVE
  ) {
    return { type: 'sourceFile', filePath: WEB_REACT_NATIVE };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
