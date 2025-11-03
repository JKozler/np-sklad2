// src/services/inventoryCardService.ts
import { apiClient } from './apiClient';

export interface InventoryCard {
  id: string;
  createdAt: string;
  averageCostPrice: number;
  currentStockQuantity: number;
  currentStockValue: number;
  issueRequestQuantity: number;
  currentStockQuantityWithIssueRequests: number;
  lastCostPrice: number;
  averageCostPriceCurrency: string;
  currentStockValueCurrency: string;
  lastCostPriceCurrency: string;
  createdById: string;
  assignedUserId: string | null;
  warehouseId: string;
  warehouseName: string;
  accountingPeriodId: string;
  accountingPeriodName: string;
}

export interface InventoryCardsResponse {
  total: number;
  list: InventoryCard[];
}

export const inventoryCardService = {
  /**
   * Načte skladové karty pro daný produkt
   * @param productId ID produktu
   * @returns Seznam skladových karet
   */
  async getByProductId(productId: string): Promise<InventoryCard[]> {
    const queryParams = new URLSearchParams({
      primaryFilter: '',
      maxSize: '20',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'accountingPeriodId,accountingPeriodName,warehouseId,warehouseName,currentStockQuantity,issueRequestQuantity,currentStockQuantityWithIssueRequests,currentStockValueCurrency,currentStockValue,averageCostPriceCurrency,averageCostPrice,lastCostPriceCurrency,lastCostPrice,createdAt'
    });

    const response = await apiClient.get<InventoryCardsResponse>(
      `/Product/${productId}/inventoryCards?${queryParams}`
    );
    
    return response.list;
  },

  /**
   * Načte konkrétní skladovou kartu podle ID
   * @param id ID skladové karty
   * @returns Skladová karta
   */
  async getById(id: string): Promise<InventoryCard> {
    return apiClient.get<InventoryCard>(`/InventoryCard/${id}`);
  },

  /**
   * Načte všechny skladové karty
   * @returns Seznam všech skladových karet
   */
  async getAll(): Promise<InventoryCardsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '200',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc'
    });

    return apiClient.get<InventoryCardsResponse>(`/InventoryCard?${queryParams}`);
  }
};