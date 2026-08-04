module.exports = function (api) {
  // Metro ne pose PAS NODE_ENV=production pendant un archive Release : le script
  // react-native-xcode.sh se contente de DEV=false. La prod se lit donc sur le
  // caller, exactement comme le fait babel-preset-expo (getIsProd). Se fier a
  // NODE_ENV ici donnerait une condition qui ne se declenche jamais.
  // api.caller est cache-aware, pas besoin de api.cache.using.
  const isProduction = api.caller((caller) => {
    if (caller && caller.isDev != null) return caller.isDev === false;
    return (
      process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production'
    );
  });
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
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};


