import { platformRepository } from '@data/repositories/platformRepository';
import { regionalSettings } from '@data/repositories/regionalSettings';
import {
  DeviceRegional,
  EMPTY_SAVED_REGIONAL,
  Language,
  matchLanguage,
  RegionalProfile,
  resolveRegionalProfile,
  SavedRegional,
} from '@domain/regional/regional';
import { copilot, CopilotRegional } from '@modules/copilot';
import { i18n, setLanguage } from '@shared/i18n';
import { RegionalFormat, setActiveFormat } from '@shared/i18n/format';
import { readDeviceLocale } from '@shared/platform/locale';
import { reportError } from '@shared/utils/reportError';

interface RegionalStoreDeps {
  load: () => Promise<SavedRegional>;
  save: (changes: Partial<SavedRegional>) => Promise<void>;
  readDevice: () => DeviceRegional;
  apply: (profile: RegionalProfile) => Promise<void>;
  readAppLanguage: () => string | null;
  writeAppLanguage: (language: Language | null) => void;
}

const sameProfile = (a: RegionalProfile, b: RegionalProfile) => JSON.stringify(a) === JSON.stringify(b);

export function createRegionalStore(deps: RegionalStoreDeps) {
  const listeners = new Set<() => void>();
  let saved = EMPTY_SAVED_REGIONAL;
  let profile: RegionalProfile | null = null;
  let initial: RegionalProfile | null = null;

  const resolve = () => resolveRegionalProfile(deps.readDevice(), saved);

  async function adoptAppLanguage() {
    const chosen = deps.readAppLanguage();
    if (chosen === null) return;

    const language = matchLanguage([chosen]);
    if (language === saved.language) return;
    saved = { ...saved, language };
    await deps.save({ language });
  }

  async function publish(next: RegionalProfile) {
    if (profile !== null && sameProfile(profile, next)) return;
    profile = next;
    await deps.apply(next);
    listeners.forEach((listener) => listener());
  }

  return {
    current(): RegionalProfile {
      if (profile !== null) return profile;
      initial ??= resolve();
      return initial;
    },

    saved: () => saved,

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async load(): Promise<void> {
      saved = await deps.load();
      await adoptAppLanguage();
      await publish(resolve());
    },

    async refresh(): Promise<void> {
      await adoptAppLanguage();
      await publish(resolve());
    },

    async chooseLanguage(language: Language | null): Promise<void> {
      deps.writeAppLanguage(language);
      saved = { ...saved, language };
      await deps.save({ language });
      await publish(resolve());
    },

    async update(changes: Partial<SavedRegional>): Promise<void> {
      await deps.save(changes);
      saved = { ...saved, ...changes };
      await publish(resolve());
    },
  };
}

export const formatOf = ({
  language,
  formatLocale,
  currency,
  distanceUnit,
  volumeUnit,
  consumptionUnit,
  firstWeekday,
  hourCycle,
}: RegionalProfile): RegionalFormat => ({
  language,
  locale: formatLocale,
  currency,
  distanceUnit,
  volumeUnit,
  consumptionUnit,
  firstWeekday,
  hourCycle,
});

export const copilotRegionalOf = ({ language, formatLocale, currency, distanceUnit }: RegionalProfile): CopilotRegional => ({
  languageTag: language,
  formatLocale,
  currencyCode: currency,
  distanceUnit,
});

function syncCopilotRegional(profile: RegionalProfile): void {
  try {
    copilot.setRegional(copilotRegionalOf(profile));
  } catch (error) {
    reportError(error);
  }
}

async function applyProfile(profile: RegionalProfile): Promise<void> {
  await setLanguage(profile.language);
  setActiveFormat(formatOf(profile));
  syncCopilotRegional(profile);
  await platformRepository.localizeSystemNames({ private: i18n.t('platform.private'), other: i18n.t('platform.other') });
}

export const regionalStore = createRegionalStore({
  load: () => regionalSettings.load(),
  save: (changes) => regionalSettings.save(changes),
  readDevice: readDeviceLocale,
  apply: applyProfile,
  readAppLanguage: copilot.getAppLanguage,
  writeAppLanguage: (language) => void copilot.setAppLanguage(language),
});
