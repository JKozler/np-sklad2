// src/services/reloadAbraService.ts
import { apiClient } from './apiClient';

export interface ReloadAbraResponse {
  success: boolean;
  message: string;
  entityType: string;
  evidence: string;
  total: number;
  processed: number;
  deleted: number;
  errors: number;
  items: Array<{
    action: string;
    id: string;
    abraId: number;
    name: string;
  }>;
  deletedItems: any[];
  errorDetails: any[];
}

export const reloadAbraService = {
  async syncInventoryTransactionType(): Promise<ReloadAbraResponse> {
    console.log('🔄 Syncing InventoryTransactionType from Abra...');
    return apiClient.get<ReloadAbraResponse>('/ReloadAbra/InventoryTransactionType');
  },

  async syncProduct(): Promise<ReloadAbraResponse> {
    console.log('🔄 Syncing Products from Abra...');
    return apiClient.get<ReloadAbraResponse>('/ReloadAbra/Product');
  },

  async syncWarehouse(): Promise<ReloadAbraResponse> {
    console.log('🔄 Syncing Warehouses from Abra...');
    return apiClient.get<ReloadAbraResponse>('/ReloadAbra/Warehouse');
  }
};