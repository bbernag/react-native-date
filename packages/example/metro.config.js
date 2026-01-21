const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');
// Library root
const libraryRoot = path.resolve(__dirname, '../native-date');
// Shared examples root
const examplesRoot = path.resolve(__dirname, '../native-date-examples');

// Path to example's node_modules
const exampleNodeModules = path.resolve(__dirname, 'node_modules');

/**
 * Metro configuration
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [monorepoRoot, libraryRoot, examplesRoot],
  resolver: {
    nodeModulesPaths: [
      exampleNodeModules,
      path.resolve(libraryRoot, 'node_modules'),
      path.resolve(examplesRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Custom resolver to force react/react-native from example's node_modules
    resolveRequest: (context, moduleName, platform) => {
      // Force react and react-native to come from example's node_modules
      if (moduleName === 'react' || moduleName === 'react-native') {
        return {
          filePath: require.resolve(moduleName, { paths: [exampleNodeModules] }),
          type: 'sourceFile',
        };
      }
      // Let metro handle everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
