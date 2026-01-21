const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

// Monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');
// Library root
const libraryRoot = path.resolve(__dirname, '../native-date');
// Shared examples root
const examplesRoot = path.resolve(__dirname, '../native-date-examples');

// Path to expo-example's node_modules
const expoNodeModules = path.resolve(__dirname, 'node_modules');

const config = getDefaultConfig(__dirname);

config.watchFolders = [monorepoRoot, libraryRoot, examplesRoot];
config.resolver.nodeModulesPaths = [
  expoNodeModules,
  path.resolve(libraryRoot, 'node_modules'),
  path.resolve(examplesRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Custom resolver to force react/react-native from expo-example's node_modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react-native') {
    return {
      filePath: require.resolve(moduleName, { paths: [expoNodeModules] }),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
