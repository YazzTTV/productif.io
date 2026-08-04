module.exports = function (api) {
  // Le cache doit dépendre de NODE_ENV : la liste de plugins change en production
  api.cache.using(() => process.env.NODE_ENV);
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
      // En production uniquement : retirer les console.log de diagnostic
      // ([appBlocking], [liveActivity]...) qui restaient lisibles dans un build
      // Release avec l'iPhone branché en USB. error et warn sont conservés.
      ...(process.env.NODE_ENV === 'production'
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};


