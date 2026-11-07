import { useRef } from 'react';
import { ensureNotifications } from '@/shared/platform/notifications';
import { copilot } from '@modules/copilot';
import { PLATFORM_PACKAGES } from '@modules/copilot/platforms';
import { COPILOT_COPY } from './copy';

const OUTSIDE_TEST_DELAY_MS = 5000;

interface Sample {
  source: string;
  text: string;
}

const SAMPLES: [Sample, ...Sample[]] = [
  { source: PLATFORM_PACKAGES.uber, text: 'R$ 18,40 | ★ 4,92 | 5 min (2,1 km) | Viagem de 14 min (6,4 km) | Aceitar' },
  { source: PLATFORM_PACKAGES.ninetyNine, text: 'R$ 11,20 | ★ 4,75 | 4 min (1,5 km) | Viagem de 18 min (6,5 km) | Aceitar' },
  { source: PLATFORM_PACKAGES.inDrive, text: 'R$ 7,00 | 6 min (3,0 km) | Viagem de 22 min (9,0 km) | Aceitar' },
];

export function useCopilotTests(refresh: () => void, notify: (message: string) => void) {
  const sampleIndex = useRef(0);

  const nextSample = (): Sample => {
    const sample = SAMPLES[sampleIndex.current % SAMPLES.length] ?? SAMPLES[0];
    sampleIndex.current += 1;
    return sample;
  };

  const test = () => {
    const { text, source } = nextSample();
    notify(copilot.testOffer(text, source) ? COPILOT_COPY.testSent : COPILOT_COPY.accessibilityForTest);
    refresh();
  };

  const testNotification = async () => {
    if (!(await ensureNotifications())) return notify(COPILOT_COPY.notificationsForExample);

    const { text, source } = nextSample();
    notify(copilot.testNotification(text, source) ? COPILOT_COPY.exampleSent : COPILOT_COPY.notificationsForExample);
  };

  const testOutside = () => {
    const { text, source } = nextSample();
    notify(copilot.testOffer(text, source, OUTSIDE_TEST_DELAY_MS) ? COPILOT_COPY.outsideTestSent : COPILOT_COPY.accessibilityForTest);
  };

  return { test, testNotification, testOutside };
}

export type CopilotTestsState = ReturnType<typeof useCopilotTests>;
