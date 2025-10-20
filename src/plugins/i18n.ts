// src/plugins/i18n.ts
import { i18nService } from '@/services/i18nService';
import type { App } from 'vue';

export default {
  install: async (app: App) => {
    console.log('🚀 Initializing i18n plugin...');
    
    // Načteme překlady na pozadí (non-blocking)
    i18nService.loadTranslations().then(() => {
      console.log('✅ i18n translations loaded');
    }).catch((error) => {
      console.error('❌ Failed to load i18n translations:', error);
    });

    // Zpřístupníme i18nService globálně (volitelné)
    app.config.globalProperties.$i18n = i18nService;
  }
};