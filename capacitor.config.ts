import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suncola.erp',
  appName: 'Sun Cola ERP',
  webDir: 'dist',
  server: {
    url: 'https://suncola.hyperoms.xyz/',
    allowNavigation: [
      '*.cloudflareaccess.com',
      'suncola.hyperoms.xyz'
    ],
    androidScheme: 'https',
    cleartextTraffic: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },
};

export default config;
