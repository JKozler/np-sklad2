// src/services/productsService.ts
import { apiClient } from './apiClient';

export interface Product {
  id: string;
  abraId: number;
  code: string;
  name: string;
  ean?: string;
  stockType: string;
  isStockItem: boolean;
  priceWithoutVat: number;
  priceWithVat: number;
  vatRate: string;
  productGroupId?: string;
  productGroupName?: string;
  uomId?: string;
  uomName?: string;
  createdAt: string;
  createdById: string;
  assignedUserId?: string | null;
}

export interface ProductsResponse {
  total: number;
  list: Product[];
}

export interface ProductFilters {
  search?: string;
  stockType?: string;
  isStockItem?: boolean;
  productGroup?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface ProductQueryParams {
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export const productsService = {
  async getAll(filters?: ProductFilters, params?: ProductQueryParams): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: (params?.maxSize || 200).toString(), // ZMĚNA: Sníženo na 200
      offset: (params?.offset || 0).toString(),
      orderBy: params?.orderBy || 'createdAt',
      order: params?.order || 'desc',
      attributeSelect: 'abraId,code,name,stockType,productGroupId,productGroupName,uomId,uomName,priceWithoutVat,vatRate,priceWithVat,ean,isStockItem,createdAt'
    });

    console.log('🔍 API Request:', `/Product?${queryParams}`);

    return apiClient.get<ProductsResponse>(`/Product?${queryParams}`);
  },

  async getById(id: string): Promise<Product | null> {
    try {
      return await apiClient.get<Product>(`/Product/${id}`);
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/Product/${id}`);
  },

  async getProductGroups(): Promise<string[]> {
    // Získáme všechny produkty pro seznam skupin
    const response = await this.getAll(undefined, { maxSize: 200 });
    const groups = new Set<string>();
    response.list.forEach(p => {
      if (p.productGroupName) {
        groups.add(p.productGroupName);
      }
    });
    return Array.from(groups).sort();
  }
};