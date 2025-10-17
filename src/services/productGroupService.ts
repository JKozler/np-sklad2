// src/services/productGroupService.ts
import { apiClient } from './apiClient';

export interface ProductGroup {
  id: string;
  name: string;
  createdAt: string;
  createdById: string;
  assignedUserId: string | null;
}

export interface ProductGroupsResponse {
  total: number;
  list: ProductGroup[];
}

export const productGroupService = {
  async getAll(): Promise<ProductGroupsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0',
      order: 'asc'
    });

    return apiClient.get<ProductGroupsResponse>(`/ProductGroup?${queryParams}`);
  },

  async getById(id: string): Promise<ProductGroup> {
    return apiClient.get<ProductGroup>(`/ProductGroup/${id}`);
  }
};