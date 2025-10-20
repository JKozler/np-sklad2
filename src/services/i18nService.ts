// src/services/i18nService.ts
import { apiClient } from './apiClient';

export interface I18nTranslations {
  [scope: string]: {
    fields?: Record<string, string>;
    labels?: Record<string, string>;
    options?: Record<string, Record<string, string>>;
    links?: Record<string, string>;
    messages?: Record<string, string>;
    tooltips?: Record<string, string>;
    [key: string]: any;
  };
}

export interface I18nResponse {
  [key: string]: any;
}

class I18nService {
  private translations: I18nTranslations | null = null;
  private loading: boolean = false;
  private loadPromise: Promise<I18nTranslations> | null = null;

  /**
   * Načte překlady z API
   */
  async loadTranslations(forceRefresh = false): Promise<I18nTranslations> {
    // Pokud už máme překlady a nechceme force refresh, vrátíme je
    if (this.translations && !forceRefresh) {
      return this.translations;
    }

    // Pokud právě probíhá načítání, počkáme na něj
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    // Zahájíme načítání
    this.loading = true;
    this.loadPromise = this._fetchTranslations();

    try {
      this.translations = await this.loadPromise;
      return this.translations;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  private async _fetchTranslations(): Promise<I18nTranslations> {
    try {
      console.log('🌍 Loading translations...');
      const response = await apiClient.get<I18nResponse>('/I18n?default=true');
      console.log('✅ Translations loaded:', Object.keys(response).length, 'scopes');
      return response as I18nTranslations;
    } catch (error) {
      console.error('❌ Failed to load translations:', error);
      // Vrátíme prázdný objekt, aby aplikace nehavarovala
      return {};
    }
  }

  /**
   * Získá překlad pro konkrétní klíč
   * @param scope - např. "Product", "Global"
   * @param category - např. "fields", "labels", "options"
   * @param key - např. "name", "Create Product"
   * @param subKey - volitelný podklíč pro options např. "Active"
   */
  translate(
    scope: string, 
    category: string, 
    key: string, 
    subKey?: string
  ): string | null {
    if (!this.translations) {
      return null;
    }

    const scopeData = this.translations[scope];
    if (!scopeData) {
      return null;
    }

    const categoryData = scopeData[category];
    if (!categoryData) {
      return null;
    }

    if (subKey) {
      // Pro options se vnořenou strukturou
      const optionGroup = categoryData[key];
      if (optionGroup && typeof optionGroup === 'object') {
        return optionGroup[subKey] || null;
      }
      return null;
    }

    return categoryData[key] || null;
  }

  /**
   * Získá label pro pole entity
   */
  getFieldLabel(scope: string, fieldName: string): string | null {
    return this.translate(scope, 'fields', fieldName);
  }

  /**
   * Získá label pro akci/tlačítko
   */
  getLabel(scope: string, labelKey: string): string | null {
    return this.translate(scope, 'labels', labelKey);
  }

  /**
   * Získá překlad pro option value
   */
  getOptionLabel(scope: string, fieldName: string, optionValue: string): string | null {
    return this.translate(scope, 'options', fieldName, optionValue);
  }

  /**
   * Získá zprávu (message)
   */
  getMessage(scope: string, messageKey: string): string | null {
    return this.translate(scope, 'messages', messageKey);
  }

  /**
   * Získá tooltip
   */
  getTooltip(scope: string, tooltipKey: string): string | null {
    return this.translate(scope, 'tooltips', tooltipKey);
  }

  /**
   * Vyčistí cache překladů
   */
  clearCache(): void {
    this.translations = null;
  }

  /**
   * Zkontroluje, zda jsou překlady načteny
   */
  isLoaded(): boolean {
    return this.translations !== null;
  }

  /**
   * Vrátí všechny překlady pro scope
   */
  getScope(scope: string): any {
    return this.translations?.[scope] || null;
  }
}

export const i18nService = new I18nService();