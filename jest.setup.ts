import '@shared/i18n';

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(),
  resetAnalyticsData: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(() => ({})),
  deleteUnsentReports: jest.fn(),
  setCrashlyticsCollectionEnabled: jest.fn(),
}));
