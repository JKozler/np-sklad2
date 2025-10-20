// src/utils/i18nHelpers.ts
import { i18nService } from '@/services/i18nService';

/**
 * Extrahuje klíč z hodnoty ve formátu "prefix.key" a přeloží ho
 */
export function translateEnumValue(
  scope: string,
  fieldName: string,
  value: string
): string {
  // Extrahujeme klíč za tečkou (např. "typZasoby.zbozi" -> "zbozi")
  const key = value.includes('.') ? value.split('.').pop()! : value;
  
  const translation = i18nService.getOptionLabel(scope, fieldName, key);
  return translation || value;
}

/**
 * Přeloží boolean hodnotu
 */
export function translateBoolean(value: boolean): string {
  const translation = i18nService.getLabel('Global', value ? 'Yes' : 'No');
  return translation || (value ? 'Ano' : 'Ne');
}