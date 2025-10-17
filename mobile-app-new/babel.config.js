module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
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
      require.resolve('expo-router/babel'),
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};


