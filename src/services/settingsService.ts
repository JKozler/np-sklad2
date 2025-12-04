// src/services/settingsService.ts
import { apiClient } from './apiClient';

export interface SmartSettings {
  defaultInventoryTransactionType: string;
  defaultMaterialsWarehouseId: string;
  defaultProductWarehouseId: string;
}

export interface Settings {
  smartSettings: SmartSettings;
  // Další atributy settings podle potřeby
  [key: string]: any;
}

export const settingsService = {
  async getSettings(): Promise<Settings> {
    console.log('🔍 Načítám systémová nastavení');
    return apiClient.get<Settings>('/Settings');
  },

  async getSmartSettings(): Promise<SmartSettings> {
    console.log('🔍 Načítám smart nastavení');
    const settings = await this.getSettings();
    return settings.smartSettings;
  }
};
