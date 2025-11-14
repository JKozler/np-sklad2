// src/services/productsService.ts
import { apiClient } from './apiClient';

export interface Product {
  id: string;
  abraId: number;
  code: string;
  photoId: string;
  photoName: string;
  name: string;
  description?: string | null;
  ean?: string;
  stockType: string;
  isStockItem: boolean;
  costPrice?: number;
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
  [key: string]: any; // Pro whereGroup parametry
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
    const queryParams = new URLSearchParams();
    
    // Základní parametry
    queryParams.append('maxSize', (params?.maxSize || 200).toString());
    queryParams.append('offset', (params?.offset || 0).toString());
    queryParams.append('orderBy', params?.orderBy || 'createdAt');
    queryParams.append('order', params?.order || 'desc');
    queryParams.append('attributeSelect', 'abraId,code,name,stockType,productGroupId,productGroupName,uomId,uomName,priceWithoutVat,vatRate,priceWithVat,ean,isStockItem,createdAt');

    // Pokud jsou v params whereGroup parametry, přidáme je
    if (params) {
      Object.keys(params).forEach(key => {
        if (key.startsWith('whereGroup')) {
          queryParams.append(key, params[key]);
        }
      });
    }

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

  async getProductGroups(): Promise<Array<{ id: string; name: string }>> {
    const { productGroupService } = await import('./productGroupService');
    const response = await productGroupService.getAll();
    return response.list.map(g => ({ id: g.id, name: g.name }));
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