// src/services/warehouseService.ts
import { apiClient } from './apiClient';

export interface Warehouse {
  id: string;
  abraId: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt?: string;
  createdById: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string;
}

export interface WarehousesResponse {
  total: number;
  list: Warehouse[];
}

export interface CreateWarehouseData {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  isActive?: boolean;
}

export const warehouseService = {
  async getAll(): Promise<WarehousesResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0',
      order: 'desc'
    });

    return apiClient.get<WarehousesResponse>(`/Warehouse?${queryParams}`);
  },

  async getById(id: string): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/Warehouse/${id}`);
  },

  async create(data: CreateWarehouseData): Promise<Warehouse> {
    console.log('➕ Creating warehouse:', data);
    return apiClient.post<Warehouse>('/Warehouse', data);
  },

  async update(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
    console.log('✏️ Updating warehouse:', id, data);
    return apiClient.put<Warehouse>(`/Warehouse/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting warehouse:', id);
    await apiClient.delete(`/Warehouse/${id}`);
  }
};