import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { PSEUDO_LANGUAGE, pseudoTree } from './pseudo';
import { NAMESPACES, resources, SOURCE_LANGUAGE } from './resources';

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: SOURCE_LANGUAGE,
  fallbackLng: SOURCE_LANGUAGE,
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export async function setLanguage(language: string): Promise<void> {
  if (i18n.language === language) return;
  await i18n.changeLanguage(language);
}

export function enablePseudoLanguage(): void {
  NAMESPACES.forEach((namespace) => i18n.addResourceBundle(PSEUDO_LANGUAGE, namespace, pseudoTree(resources[SOURCE_LANGUAGE][namespace])));
}

export { PSEUDO_LANGUAGE };
