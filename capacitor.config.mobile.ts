import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.productif',
  appName: 'Productif.io',
  webDir: 'out',
  server: {
    // Pour la production mobile, pointer vers le serveur productif.io
    url: 'https://www.productif.io',
    cleartext: false, // HTTPS uniquement pour la production
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#22c55e", // Couleur verte de votre thème
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#22c55e"
    },
    Keyboard: {
      resize: "body" as any,
      style: "dark" as any,
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false // Désactivé en production
  },
  ios: {
    scheme: "productifio",
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#22c55e"
  }
};

export default config; 