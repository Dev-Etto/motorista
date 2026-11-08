import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { getCrashlytics, setCrashlyticsCollectionEnabled } from '@react-native-firebase/crashlytics';
import { addDoc, collection, getFirestore, serverTimestamp } from '@react-native-firebase/firestore';
import type { AnalyticsTransport } from './analytics';
import type { ProblemReportTransport } from './problemReports';

export const firebaseAnalyticsTransport: AnalyticsTransport = {
  send: async (event, params) => {
    await logEvent(getAnalytics(), event, params);
  },
};

export async function applyDataCollection({ usageStats, crashReports }: { usageStats: boolean; crashReports: boolean }): Promise<void> {
  await Promise.all([setAnalyticsCollectionEnabled(getAnalytics(), usageStats), setCrashlyticsCollectionEnabled(getCrashlytics(), crashReports)]);
}

export const firestoreProblemReportTransport: ProblemReportTransport = {
  send: async (payload) => {
    await addDoc(collection(getFirestore(), 'reports'), { ...payload, createdAt: serverTimestamp() });
  },
};
