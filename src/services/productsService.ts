// src/services/productsService.ts
import { apiClient } from './apiClient';

export interface Product {
  id: string;
  abraId: number;
  code: string;
  name: string;
  description?: string | null;
  ean?: string;
  stockType: string;
  isStockItem: boolean;
  price: number | null;
  priceWithoutVat: number | null;
  priceWithVat: number | null;
  priceType: string;
  vatRate: string;
  productGroupId?: string | null;
  productGroupName?: string | null;
  uomId?: string | null;
  uomName?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
  createdById: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
  deleted?: boolean;
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

export interface CreateProductData {
  name: string;
  code: string;
  description?: string | null;
  ean?: string;
  priceWithoutVat?: number | null;
  priceWithVat?: number | null;
  price?: number | null;
  stockType: string;
  isStockItem: boolean;
  vatRate: string;
  priceType?: string;
  productGroupId?: string | null;
  uomId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string | null;
  code?: string;
  ean?: string;
  priceWithoutVat?: number | null;
  priceWithVat?: number | null;
  price?: number | null;
  stockType?: string;
  isStockItem?: boolean;
  vatRate?: string;
  priceType?: string;
  productGroupId?: string | null;
  uomId?: string;
}

export const productsService = {
  async getAll(filters?: ProductFilters, params?: ProductQueryParams): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: (params?.maxSize || 200).toString(),
      offset: (params?.offset || 0).toString(),
      orderBy: params?.orderBy || 'createdAt',
      order: params?.order || 'desc',
      attributeSelect: 'abraId,code,name,stockType,productGroupId,productGroupName,uomId,uomName,priceWithoutVat,vatRate,priceWithVat,ean,isStockItem,createdAt'
    });

    console.log('🔍 API Request:', `/Product?${queryParams}`);

    return apiClient.get<ProductsResponse>(`/Product?${queryParams}`);
  },

  async getById(id: string): Promise<Product> {
    console.log('🔍 Getting product:', id);
    return apiClient.get<Product>(`/Product/${id}`);
  },

  async create(data: CreateProductData): Promise<Product> {
    console.log('➕ Creating product:', data);
    return apiClient.post<Product>('/Product', data);
  },

  async update(id: string, data: UpdateProductData): Promise<Product> {
    console.log('✏️ Updating product:', id, data);
    return apiClient.put<Product>(`/Product/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting product:', id);
    await apiClient.delete(`/Product/${id}`);
  },

  async getProductGroups(): Promise<string[]> {
    const response = await this.getAll(undefined, { maxSize: 200 });
    const groups = new Set<string>();
    response.list.forEach(p => {
      if (p.productGroupName) {
        groups.add(p.productGroupName);
      }
    });
    return Array.from(groups).sort();
  },

  async getUOMs(): Promise<Array<{ id: string; name: string }>> {
    // Volej přímo UOM API endpoint
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0',
      orderBy: 'name',
      order: 'asc',
      attributeSelect: 'id,name'
    });

    interface UOMsResponse {
      total: number;
      list: Array<{ id: string; name: string }>;
    }

    const response = await apiClient.get<UOMsResponse>(`/UOM?${queryParams}`);
    return response.list;
  }
};