import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.productif',
  appName: 'Productif.io',
  webDir: 'out',
  server: {
    url: 'https://productif.io', // URL de production
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#22c55e",
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
    allowMixedContent: false, // Désactivé en production
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