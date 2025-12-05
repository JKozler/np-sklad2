// src/services/productionWorkerService.ts
import { apiClient } from './apiClient';

export interface ProductionWorker {
  id: string;
  name: string;
  createdAt?: string;
  createdById?: string;
  assignedUserId?: string | null;
}

export interface ProductionWorkersResponse {
  total: number;
  list: ProductionWorker[];
}

export interface ProductionWorkerQueryParams {
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  attributeSelect?: string;
  [key: string]: any; // Pro whereGroup parametry
}

export const productionWorkerService = {
  async getAll(params?: ProductionWorkerQueryParams): Promise<ProductionWorkersResponse> {
    const queryParams = new URLSearchParams();

    // Základní parametry
    queryParams.append('maxSize', (params?.maxSize || 10).toString());
    queryParams.append('offset', (params?.offset || 0).toString());
    queryParams.append('orderBy', params?.orderBy || 'createdAt');
    queryParams.append('order', params?.order || 'desc');
    queryParams.append('attributeSelect', params?.attributeSelect || 'name');

    // Pokud jsou v params whereGroup parametry, přidáme je
    if (params) {
      Object.keys(params).forEach(key => {
        if (key.startsWith('whereGroup')) {
          queryParams.append(key, params[key]);
        }
      });
    }

    console.log('🔍 API Request:', `/ProductionWorker?${queryParams}`);

    return apiClient.get<ProductionWorkersResponse>(`/ProductionWorker?${queryParams}`);
  },

  async getById(id: string): Promise<ProductionWorker> {
    console.log('🔍 Getting production worker:', id);
    return apiClient.get<ProductionWorker>(`/ProductionWorker/${id}`);
  }
};
