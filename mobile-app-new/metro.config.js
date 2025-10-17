// Metro configuration extending Expo defaults
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

// Enable experimental require.context support (useful for expo-router)
defaultConfig.transformer = {
  ...(defaultConfig.transformer || {}),
  unstable_allowRequireContext: true,
};

// Add custom aliases
defaultConfig.resolver = {
  ...(defaultConfig.resolver || {}),
  extraNodeModules: {
    ...((defaultConfig.resolver && defaultConfig.resolver.extraNodeModules) || {}),
    '@': path.resolve(projectRoot),
  },
};

module.exports = defaultConfig;


