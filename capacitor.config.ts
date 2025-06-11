import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.productif',
  appName: 'Productif.io',
  webDir: 'dist',
  server: {
    url: 'https://productif.io',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
