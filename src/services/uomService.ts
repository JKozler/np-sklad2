// src/services/uomService.ts
import { apiClient } from './apiClient';

export interface UOM {
  id: string;
  name: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface UOMsResponse {
  total: number;
  list: UOM[];
}

export const uomService = {
  async getAll(): Promise<UOMsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0',
      orderBy: 'name',
      order: 'asc',
      attributeSelect: 'id,name'
    });

    return apiClient.get<UOMsResponse>(`/UOM?${queryParams}`);
  },

  async getById(id: string): Promise<UOM> {
    return apiClient.get<UOM>(`/UOM/${id}`);
  }
};