// src/services/productionOrderService.ts
import { apiClient } from './apiClient';

export interface ProductionOrder {
  id: string;
  name: string;
  deleted?: boolean;
  description?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
  status: string;
  date: string | null;
  productionBookedFlag: boolean;
  quantity?: number;
  errorMessage?: string | null;
  createdById: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
  productionWorkerId?: string | null;
  productionWorkerName?: string | null;
  inventoryTransactionId?: string | null;
  inventoryTransactionName?: string | null;
  productId?: string | null;
  productName?: string | null;
}

export interface ProductionOrdersResponse {
  total: number;
  list: ProductionOrder[];
}

export interface ProductionOrderQueryParams {
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  [key: string]: any; // Pro whereGroup parametry
}

export interface CreateProductionOrderData {
  name?: string;
  description?: string | null;
  status?: string;
  date?: string | null;
  quantity?: number;
  productId: string;
  productionWorkerId?: string | null;
}

export interface UpdateProductionOrderData {
  name?: string;
  description?: string | null;
  status?: string;
  date?: string | null;
  quantity?: number;
  productId?: string;
  productionWorkerId?: string | null;
}

export const productionOrderService = {
  async getAll(params?: ProductionOrderQueryParams): Promise<ProductionOrdersResponse> {
    const queryParams = new URLSearchParams();

    // Základní parametry
    queryParams.append('maxSize', (params?.maxSize || 20).toString());
    queryParams.append('offset', (params?.offset || 0).toString());
    queryParams.append('orderBy', params?.orderBy || 'createdAt');
    queryParams.append('order', params?.order || 'desc');
    queryParams.append('attributeSelect', 'date,name,status,productionBookedFlag,errorMessage,createdAt,productName');

    // Pokud jsou v params whereGroup parametry, přidáme je
    if (params) {
      Object.keys(params).forEach(key => {
        if (key.startsWith('whereGroup')) {
          queryParams.append(key, params[key]);
        }
      });
    }

    console.log('🔍 API Request:', `/ProductionOrder?${queryParams}`);

    return apiClient.get<ProductionOrdersResponse>(`/ProductionOrder?${queryParams}`);
  },

  async getById(id: string): Promise<ProductionOrder> {
    console.log('🔍 Getting production order:', id);
    return apiClient.get<ProductionOrder>(`/ProductionOrder/${id}`);
  },

  async create(data: CreateProductionOrderData): Promise<ProductionOrder> {
    console.log('➕ Creating production order:', data);
    return apiClient.post<ProductionOrder>('/ProductionOrder', data);
  },

  async update(id: string, data: UpdateProductionOrderData): Promise<ProductionOrder> {
    console.log('✏️ Updating production order:', id, data);
    return apiClient.put<ProductionOrder>(`/ProductionOrder/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting production order:', id);
    await apiClient.delete(`/ProductionOrder/${id}`);
  }
};
