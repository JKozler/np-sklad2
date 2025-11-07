// src/services/inventoryTransactionService.ts
import { apiClient } from './apiClient';

export interface InventoryTransactionItem {
  id?: string;
  productId: string;
  productName?: string;
  unitPrice?: number;
  quantity: number;
  price?: number;
  totalPrice?: number;
  notes?: string;
  inventoryTransactionId?: string;
}

export interface InventoryTransaction {
  id: string;
  name: string;
  code?: string;
  transactionTypeId: string;
  transactionTypeName?: string;
  transactionDirection?: string;
  warehouseFromId?: string | null;
  warehouseFromName?: string | null;
  warehouseToId?: string | null;
  warehouseToName?: string | null;
  transactionDate: string;
  status?: string;
  notes?: string;
  totalAmount?: number;
  totalPrice?: number;
  totalPriceCurrency?: string;
  createdAt: string;
  modifiedAt?: string;
  createdById: string;
  createdByName?: string;
  items?: InventoryTransactionItem[];
}

export interface InventoryTransactionsResponse {
  total: number;
  list: InventoryTransaction[];
}

/**
 * Data pro vytvoření nové inventory transaction
 * @property items - Array položek:
 *   - undefined/null - žádná akce s položkami
 *   - [] (prázdné pole) - smaže všechny položky
 *   - [{bez id}] - vytvoří nové položky
 *   - [{s id}] - aktualizuje existující položky
 */
export interface CreateInventoryTransactionData {
  name: string;
  transactionTypeId: string;
  transactionDirection: string;
  warehouseFromId?: string | null;
  warehouseId?: string | null;
  warehouseToId?: string | null;
  transactionDate: string;
  notes?: string;
  items?: InventoryTransactionItem[] | null;
}

/**
 * Data pro aktualizaci inventory transaction
 * @property items - Array položek (při updatu MUSÍ obsahovat VŠECHNY položky):
 *   - undefined/null - žádná akce s položkami
 *   - [] (prázdné pole) - smaže všechny položky
 *   - [{s id}] - existující položky k zachování/aktualizaci
 *   - [{bez id}] - nové položky k vytvoření
 *   - Chybějící položky (které mají ID ale nejsou v poli) budou SMAZÁNY!
 */
export interface UpdateInventoryTransactionData {
  name?: string;
  transactionTypeId?: string;
  transactionDirection?: string;
  warehouseFromId?: string | null;
  warehouseId?: string | null;
  warehouseToId?: string | null;
  transactionDate?: string;
  notes?: string;
  status?: string;
  items?: InventoryTransactionItem[] | null;
}

export interface InventoryTransactionFilters {
  typeId?: string;
  warehouseId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
}

export const inventoryTransactionService = {
  async getAll(filters?: InventoryTransactionFilters): Promise<InventoryTransactionsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '200',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'code,transactionDirection,transactionTypeId,transactionTypeName,name,status,totalPriceCurrency,totalPrice,warehouseFromId,warehouseFromName,warehouseToId,warehouseToName,transactionDate,createdAt'
    });

    // Přidání textového filtru pokud existuje
    if (filters?.searchText) {
      queryParams.append('whereGroup[0][type]', 'textFilter');
      queryParams.append('whereGroup[0][value]', filters.searchText);
    }

    console.log('🔍 API Request:', `/InventoryTransaction?${queryParams}`);

    return apiClient.get<InventoryTransactionsResponse>(`/InventoryTransaction?${queryParams}`);
  },

  async getById(id: string): Promise<InventoryTransaction> {
    return apiClient.get<InventoryTransaction>(`/InventoryTransaction/${id}`);
  },

  /**
   * Vytvoří novou inventory transaction
   * @param data - Data transakce včetně volitelného pole items[]
   */
  async create(data: CreateInventoryTransactionData): Promise<InventoryTransaction> {
    console.log('➕ Creating inventory transaction:', data);
    data.warehouseId = data.warehouseFromId;
    // Validace items pokud jsou přítomny
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        if (!item.productId) {
          throw new Error(`Item at index ${index} is missing productId`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Item at index ${index} has invalid quantity`);
        }
      });
    }
    
    return apiClient.post<InventoryTransaction>('/InventoryTransaction', data);
  },

  /**
   * Aktualizuje inventory transaction
   * DŮLEŽITÉ: Pokud je přítomno pole items[], musí obsahovat VŠECHNY položky!
   * Položky s ID budou aktualizovány, bez ID vytvořeny, chybějící SMAZÁNY.
   * 
   * @param id - ID transakce k aktualizaci
   * @param data - Data k aktualizaci včetně volitelného pole items[]
   */
  async update(id: string, data: UpdateInventoryTransactionData): Promise<InventoryTransaction> {
    console.log('✏️ Updating inventory transaction:', id, data);
    data.warehouseId = data.warehouseFromId;
    // Validace items pokud jsou přítomny
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        if (!item.productId) {
          throw new Error(`Item at index ${index} is missing productId`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Item at index ${index} has invalid quantity`);
        }
      });
    }
    
    return apiClient.put<InventoryTransaction>(`/InventoryTransaction/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting inventory transaction:', id);
    await apiClient.delete(`/InventoryTransaction/${id}`);
  },

  // ===================================================================
  // LEGACY METHODS - Alternativní způsob práce s items
  // Tyto metody jsou stále podporovány, ale doporučuje se použít
  // nové items[] pole přímo v create/update requestech
  // ===================================================================

  /**
   * @deprecated Použijte raději items[] pole v create/update requestech
   */
  async addItem(transactionId: string, item: InventoryTransactionItem): Promise<any> {
    console.log('➕ Adding item to transaction (legacy method):', transactionId, item);
    
    item.inventoryTransactionId = transactionId;
    return apiClient.post(`/InventoryTransactionItem`, item);
  },

  /**
   * @deprecated Použijte raději items[] pole v update requestu
   */
  async updateItem(transactionId: string, itemId: string, item: Partial<InventoryTransactionItem>): Promise<any> {
    console.log('✏️ Updating transaction item (legacy method):', transactionId, itemId, item);
    item.inventoryTransactionId = transactionId;
    return apiClient.put(`/InventoryTransactionItem/${itemId}`, item);
  },

  /**
   * @deprecated Použijte raději items[] pole v update requestu (prázdné pole pro smazání všech)
   */
  async deleteItem(transactionId: string, itemId: string): Promise<void> {
    console.log('🗑️ Deleting transaction item (legacy method):', transactionId, itemId);
    await apiClient.delete(`/InventoryTransaction/${transactionId}/items/${itemId}`);
  },

  /**
   * Načte položky transakce
   */
  async getItems(transactionId: string): Promise<InventoryTransactionItem[]> {
    console.log('📋 Getting transaction items:', transactionId);
    const response = await apiClient.get<{ list: InventoryTransactionItem[] }>(`/InventoryTransaction/${transactionId}/items`);
    return response.list;
  }
};