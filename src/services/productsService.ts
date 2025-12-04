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
  outageFlag?: boolean; // Nový atribut - zda produkt chybí na skladě
  outageExpectedStockDate?: string; // Nový atribut - očekávané naskladnění
  outageNote?: string; // Nový atribut - poznámka k nedostupnosti
  accountsIds?: string[]; // Nový atribut - pole ID dodavatelů
  accountsNames?: Record<string, string>; // Nový atribut - mapování ID na jména dodavatelů
  accountsColumns?: Record<string, { supplierSku: string | null; costPrice: number | null }>; // Nový atribut - data dodavatelů
  minimumStockQuantity?: number; // Minimální skladové množství
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
  photoId?: string;
  photoName?: string;
  outageFlag?: boolean;
  outageExpectedStockDate?: string;
  outageNote?: string;
  accountsIds?: string[];
  accountsNames?: Record<string, string>;
  accountsColumns?: Record<string, { supplierSku: string | null; costPrice: number | null }>;
  minimumStockQuantity?: number;
}

export const productsService = {
  async getAll(filters?: ProductFilters, params?: ProductQueryParams): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    
    // Základní parametry
    queryParams.append('maxSize', (params?.maxSize || 200).toString());
    queryParams.append('offset', (params?.offset || 0).toString());
    queryParams.append('orderBy', params?.orderBy || 'createdAt');
    queryParams.append('order', params?.order || 'desc');
    queryParams.append('attributeSelect', 'abraId,code,name,stockType,productGroupId,productGroupName,uomId,uomName,priceWithoutVat,vatRate,priceWithVat,ean,isStockItem,outageFlag,createdAt');

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
  },

  /**
   * Upload fotky produktu
   * @param productId ID produktu
   * @param file Soubor k uploadu
   * @returns Aktualizovaný produkt s novou fotkou
   */
  async uploadPhoto(productId: string, file: File): Promise<Product> {
    console.log('📸 Uploading photo for product:', productId);

    // Krok 1: Přečti soubor jako base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Krok 2: Upload do Attachment API
    const attachmentData = {
      field: 'photo',
      file: base64,
      name: file.name,
      relatedType: 'Product',
      role: 'Attachment',
      size: file.size,
      type: file.type
    };

    console.log('📤 Posting attachment:', { name: file.name, size: file.size, type: file.type });

    interface AttachmentResponse {
      id: string;
      name: string;
    }

    const attachment = await apiClient.post<AttachmentResponse>('/Attachment', attachmentData);
    console.log('✅ Attachment created:', attachment);

    // Krok 3: Aktualizuj produkt s photoId
    const updateData = {
      photoId: attachment.id,
      photoName: attachment.name
    };

    console.log('📤 Updating product with photo:', updateData);
    const updatedProduct = await apiClient.put<Product>(`/Product/${productId}`, updateData);
    console.log('✅ Product updated with photo');

    return updatedProduct;
  }
};