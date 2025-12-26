module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // babel-preset-expo inclut déjà expo-router
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.tsx',
            '.json',
            '.js',
            '.jsx',
          ],
        },
      ],
      // expo-router/babel est déprécié et inclus dans babel-preset-expo depuis SDK 50
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};


