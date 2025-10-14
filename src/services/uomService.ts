// src/services/productsService.ts
import { apiClient } from './apiClient';
import { uomService } from './uomService';

// ... ostatní interface

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
  uomId: string;  // <-- ZMĚNA: už není null
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
  uomId?: string;  // <-- ZMĚNA: už není null
}

export const productsService = {
  // ... ostatní metody zůstávají stejné
  
  async getUOMs(): Promise<Array<{ id: string; name: string }>> {
    const response = await uomService.getAll();
    return response.list.map(uom => ({ id: uom.id, name: uom.name }));
  }
};