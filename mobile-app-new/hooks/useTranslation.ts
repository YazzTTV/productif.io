import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook pour utiliser les traductions dans les composants
 * Retourne la fonction de traduction `t` du LanguageContext
 * 
 * @example
 * const t = useTranslation();
 * return <Text>{t('hello')}</Text>;
 */
export function useTranslation() {
  const { t } = useLanguage();
  return t;
}



