// src/composables/useI18n.ts
import { ref, onMounted } from 'vue';
import { i18nService } from '@/services/i18nService';

export function useI18n(scope?: string) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isLoaded = ref(i18nService.isLoaded());

  const loadTranslations = async (forceRefresh = false) => {
    loading.value = true;
    error.value = null;

    try {
      await i18nService.loadTranslations(forceRefresh);
      isLoaded.value = true;
    } catch (err: any) {
      error.value = err.message || 'Chyba při načítání překladů';
      console.error('Failed to load translations:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Přeloží libovolný klíč z dané kategorie
   */
  const t = (key: string, category: string = 'fields', subKey?: string): string => {
    if (!scope) return key;
    
    const translation = i18nService.translate(scope, category, key, subKey);
    return translation || key;
  };

  /**
   * Přeloží field label
   */
  const tf = (fieldName: string): string => {
    if (!scope) return fieldName;
    
    const translation = i18nService.getFieldLabel(scope, fieldName);
    return translation || fieldName;
  };

  /**
   * Přeloží label (tlačítka, akce)
   */
  const tl = (labelKey: string): string => {
    if (!scope) return labelKey;
    
    const translation = i18nService.getLabel(scope, labelKey);
    return translation || labelKey;
  };

  /**
   * Přeloží option value
   */
  const to = (fieldName: string, optionValue: string): string => {
    if (!scope) return optionValue;
    
    const translation = i18nService.getOptionLabel(scope, fieldName, optionValue);
    return translation || optionValue;
  };

  /**
   * Přeloží zprávu
   */
  const tm = (messageKey: string): string => {
    if (!scope) return messageKey;
    
    const translation = i18nService.getMessage(scope, messageKey);
    return translation || messageKey;
  };

  /**
   * Přeloží tooltip
   */
  const tt = (tooltipKey: string): string => {
    if (!scope) return tooltipKey;
    
    const translation = i18nService.getTooltip(scope, tooltipKey);
    return translation || tooltipKey;
  };

  // Automaticky načíst překlady při mountu
  onMounted(() => {
    if (!isLoaded.value) {
      loadTranslations();
    }
  });

  return {
    loading,
    error,
    isLoaded,
    loadTranslations,
    t,      // obecný překlad
    tf,     // field překlad
    tl,     // label překlad
    to,     // option překlad
    tm,     // message překlad
    tt,     // tooltip překlad
  };
}