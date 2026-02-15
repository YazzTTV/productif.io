const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Plugin Expo pour ajouter les modular headers requis par Firebase/GoogleUtilities.
 * Résout l'erreur: "FirebaseCoreInternal depends upon GoogleUtilities, which does not define modules"
 */
function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = await fs.promises.readFile(podfilePath, 'utf8');

      const modularHeadersBlock = `
  # Modular headers requis pour Firebase (Swift pods)
  pod 'GoogleUtilities', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseAppCheckInterop', :modular_headers => true
`;

      // Éviter les doublons si le plugin a déjà été exécuté
      if (contents.includes("pod 'GoogleUtilities', :modular_headers => true")) {
        return config;
      }

      // Insérer après "target 'Productifio' do" et avant "use_expo_modules!"
      const targetMatch = contents.match(/target 'Productifio' do\s*\n(\s*)(use_expo_modules!)/);
      if (targetMatch) {
        const indent = targetMatch[1];
        const insertion = targetMatch[0].replace(
          'use_expo_modules!',
          modularHeadersBlock.trim() + '\n' + indent + 'use_expo_modules!'
        );
        contents = contents.replace(targetMatch[0], insertion);
      } else {
        // Fallback: insérer après la première occurrence de "target 'Productifio'"
        contents = contents.replace(
          /(target 'Productifio' do\n)/,
          `$1${modularHeadersBlock}`
        );
      }

      await fs.promises.writeFile(podfilePath, contents, 'utf8');
      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
