import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'io.productif',
  appName: 'Productif.io',
  webDir: '.next',
  server: {
    url: 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http',
    iosScheme: 'http'
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
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    scheme: "capacitor",
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#22c55e",
    limitsNavigationsToAppBoundDomains: false,
    allowsLinkPreview: false,
    handleApplicationNotifications: true
  }
};

export default config; 