// src/services/carrierService.ts
import { apiClient } from './apiClient';

export interface Carrier {
  id: string;
  name: string;
  createdAt: string;
  queue: string;
  carrierType: string;
  country: string;
  eshopName: string;
  createdById: string;
  assignedUserId: string | null;
}

export interface CarriersResponse {
  total: number;
  list: Carrier[];
}

export interface CreateCarrierData {
  name: string;
  queue: string;
  carrierType: string;
  country: string;
  eshopName: string;
}

export interface UpdateCarrierData {
  name?: string;
  queue?: string;
  carrierType?: string;
  country?: string;
  eshopName?: string;
}

export interface CarrierFilterOptions {
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  textFilter?: string;
}

export const carrierService = {
  async getAll(options: CarrierFilterOptions = {}): Promise<CarriersResponse> {
    const {
      maxSize = 20,
      offset = 0,
      orderBy = 'createdAt',
      order = 'desc',
      textFilter
    } = options;

    const queryParams = new URLSearchParams({
      maxSize: maxSize.toString(),
      offset: offset.toString(),
      orderBy,
      order,
      attributeSelect: 'country,name,queue,eshopName,carrierType'
    });

    // Přidat textový filtr, pokud je zadán
    if (textFilter && textFilter.trim()) {
      queryParams.append('whereGroup[0][type]', 'textFilter');
      queryParams.append('whereGroup[0][value]', textFilter.trim());
    }

    return apiClient.get<CarriersResponse>(`/Carrier?${queryParams}`);
  },

  async getById(id: string): Promise<Carrier> {
    return apiClient.get<Carrier>(`/Carrier/${id}`);
  },

  async create(data: CreateCarrierData): Promise<Carrier> {
    console.log('➕ Creating carrier:', data);
    return apiClient.post<Carrier>('/Carrier', data);
  },

  async update(id: string, data: UpdateCarrierData): Promise<Carrier> {
    console.log('✏️ Updating carrier:', id, data);
    return apiClient.put<Carrier>(`/Carrier/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting carrier:', id);
    await apiClient.delete(`/Carrier/${id}`);
  }
};
