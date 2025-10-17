// src/services/inventoryTransactionTypeService.ts
import { apiClient } from './apiClient';

export interface InventoryTransactionType {
  id: string;
  abraId: number;
  name: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface InventoryTransactionTypesResponse {
  total: number;
  list: InventoryTransactionType[];
}

export const inventoryTransactionTypeService = {
  async getAll(): Promise<InventoryTransactionTypesResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0',
      orderBy: 'name',
      order: 'asc',
      attributeSelect: 'id,abraId,name'
    });

    return apiClient.get<InventoryTransactionTypesResponse>(`/InventoryTransactionType?${queryParams}`);
  },

  async getById(id: string): Promise<InventoryTransactionType> {
    return apiClient.get<InventoryTransactionType>(`/InventoryTransactionType/${id}`);
  }
};