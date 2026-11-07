import { useTranslation } from 'react-i18next';
import { isFormatLocaleChoice } from '@domain/regional/regional';

export function useFormatLocaleName() {
  const { t } = useTranslation('common');
  return (locale: string) => (isFormatLocaleChoice(locale) ? t(`formatLocaleName.${locale}`) : locale);
}
