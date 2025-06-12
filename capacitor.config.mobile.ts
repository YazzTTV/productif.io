import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.productif.app',
  appName: 'Productif',
  webDir: 'public',
  server: {
    url: 'http://10.0.2.2:3000',
    cleartext: true,
    androidScheme: 'http'
  },
  android: {
    allowMixedContent: true
  }
};

export default config; 