import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suncola.erp',
  appName: 'Sun Cola ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
