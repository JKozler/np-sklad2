// src/services/bomService.ts
import { apiClient } from './apiClient';

/**
 * BOM Node struktura - reprezentuje jeden uzel ve stromě kusovníku
 */
export interface BOMNode {
  id: string;
  deleted: boolean;
  level: number;
  order: number;
  abraId: number | null;
  quantity: number;
  costPrice: number | null;
  path: string | null;
  componentProductId: string;
  componentProductName: string | null;
  assemblyProductId: string;
  assemblyProductName: string | null;
  parentBomId: string | null;
  parentBomName: string | null;
  children: BOMNode[];

  uom?: string | null;
uomId?: string | null;
}

/**
 * Response pro GET BOM - může být null pokud BOM neexistuje
 */
export interface BOMResponse {
  data: BOMNode | null;
  message?: string;
}

/**
 * Data pro vytvoření nové BOM položky
 */
export interface CreateBOMItemData {
  assemblyProductId: string;
  parentBomId: string;
  componentProductId: string;
  quantity: number;
}

/**
 * Response při vytvoření hlavního BOM nebo položky
 */
export interface CreateBOMResponse {
  id: string;
  componentProductId: string;
  assemblyProductId: string;
  level: number;
  order: number;
  parentBomId: string | null;
  quantity: number;
  deleted: boolean;
  abraId: number | null;
  costPrice: number | null;
  path: string | null;
}

/**
 * Data pro update BOM položky
 */
export interface UpdateBOMItemData {
  quantity?: number;
  componentProductId?: string;
}

export const bomService = {
  /**
   * Vytvoří prázdný hlavní kusovník pro produkt
   * Pokud již existuje, vrátí existující
   */
  async createMainBOM(productId: string): Promise<CreateBOMResponse> {
    console.log('📦 Creating main BOM for product:', productId);
    return apiClient.post<CreateBOMResponse>(`/Product/${productId}/BOM`, {});
  },

  /**
   * Načte kompletní stromovou strukturu kusovníku produktu
   */
  async getBOMTree(productId: string): Promise<BOMResponse> {
    console.log('📋 Getting BOM tree for product:', productId);
    return apiClient.get<BOMResponse>(`/Product/${productId}/BOM`);
  },

  /**
   * Vytvoří novou položku kusovníku (komponentu)
   */
  async createBOMItem(data: CreateBOMItemData): Promise<CreateBOMResponse> {
    console.log('➕ Creating BOM item:', data);
    
    // Validace
    if (!data.componentProductId) {
      throw new Error('Component product ID is required');
    }
    if (!data.assemblyProductId) {
      throw new Error('Assembly product ID is required');
    }
    if (!data.parentBomId) {
      throw new Error('Parent BOM ID is required');
    }
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    return apiClient.post<CreateBOMResponse>('/BOM', data);
  },

  /**
   * Aktualizuje BOM položku
   */
  async updateBOMItem(bomId: string, data: UpdateBOMItemData): Promise<CreateBOMResponse> {
    console.log('✏️ Updating BOM item:', bomId, data);
    return apiClient.put<CreateBOMResponse>(`/BOM/${bomId}`, data);
  },

  /**
   * Smaže BOM položku
   */
  async deleteBOMItem(bomId: string): Promise<void> {
    console.log('🗑️ Deleting BOM item:', bomId);
    await apiClient.delete(`/BOM/${bomId}`);
  },

  /**
   * Smaže celý BOM včetně všech položek
   */
  async deleteMainBOM(productId: string): Promise<void> {
    console.log('🗑️ Deleting main BOM for product:', productId);
    // Nejdřív načteme BOM abychom získali ID
    const bomResponse = await this.getBOMTree(productId);
    if (bomResponse.data) {
      await apiClient.delete(`/BOM/${bomResponse.data.id}`);
    }
  }
};