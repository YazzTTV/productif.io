import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.productif',
  appName: 'Productif.io',
  webDir: '.next',
  server: {
    url: 'http://10.0.2.2:3001',
    cleartext: true,
    androidScheme: 'http'
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
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    scheme: "productifio",
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#22c55e"
  }
};

export default config; 