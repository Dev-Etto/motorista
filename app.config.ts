import type { ConfigContext, ExpoConfig } from 'expo/config';
const NAME = 'Motorista';
const PACKAGE = 'app.motorista.android';
const isRelease = process.env.APP_VARIANT === 'release';
const UNUSED_LIBRARY_PERMISSIONS = [
  'android.permission.ACCESS_NETWORK_STATE',
  'com.google.android.c2dm.permission.RECEIVE',
  'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE',
  'android.permission.READ_APP_BADGE',
  'com.sec.android.provider.badge.permission.READ',
  'com.sec.android.provider.badge.permission.WRITE',
  'com.htc.launcher.permission.READ_SETTINGS',
  'com.htc.launcher.permission.UPDATE_SHORTCUT',
  'com.sonyericsson.home.permission.BROADCAST_BADGE',
  'com.sonymobile.home.permission.PROVIDER_INSERT_BADGE',
  'com.anddoes.launcher.permission.UPDATE_COUNT',
  'com.majeur.launcher.permission.UPDATE_BADGE',
  'com.huawei.android.launcher.permission.CHANGE_BADGE',
  'com.huawei.android.launcher.permission.READ_SETTINGS',
  'com.huawei.android.launcher.permission.WRITE_SETTINGS',
  'com.oppo.launcher.permission.READ_SETTINGS',
  'com.oppo.launcher.permission.WRITE_SETTINGS',
  'me.everything.badger.permission.BADGE_COUNT_READ',
  'me.everything.badger.permission.BADGE_COUNT_WRITE',
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME,
  slug: 'motorista',
  scheme: 'motorista',
  version: '0.8.2',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: PACKAGE,
    versionCode: 11,
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#171717',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    blockedPermissions: [
      ...(isRelease ? ['android.permission.INTERNET', ...UNUSED_LIBRARY_PERMISSIONS] : []),
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    ['expo-font', { fonts: ['./assets/fonts/Manrope-Regular.ttf', './assets/fonts/Manrope-SemiBold.ttf', './assets/fonts/Manrope-Bold.ttf'] }],
    'expo-router',
    'expo-sqlite',
    'expo-sharing',
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 220, backgroundColor: '#171717' }],
    ['expo-build-properties', { android: { minSdkVersion: 24 } }],
    ['expo-location', { isAndroidForegroundServiceEnabled: true, isAndroidBackgroundLocationEnabled: false }],
    ['expo-notifications', { color: '#171717' }],
  ],
  extra: { buildDate: new Date().toISOString().slice(0, 10) },
  experiments: { typedRoutes: false },
});
