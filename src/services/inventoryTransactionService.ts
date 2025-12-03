// src/services/inventoryTransactionService.ts
import { apiClient } from './apiClient';
import { wrapWithWildcards } from '@/utils/searchHelpers';

export interface InventoryTransactionItem {
  id?: string;
  productId: string;
  productName?: string;
  stockType?: string;
  uomName?: string;
  unitPrice?: number;
  quantity: number;
  price?: number;
  totalPrice?: number;
  description?: string;
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
  description?: string;
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
  description?: string;
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
  description?: string;
  status?: string;
  items?: InventoryTransactionItem[] | null;
}

export interface InventoryTransactionFilters {
  typeId?: string;
  warehouseId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  status?: string;
  productId?: string;
  direction?: string;
  maxSize?: number;
  offset?: number;
}

export const inventoryTransactionService = {
  async getAll(filters?: InventoryTransactionFilters): Promise<InventoryTransactionsResponse> {
    const queryParams = new URLSearchParams({
      maxSize: (filters?.maxSize || 200).toString(),
      offset: (filters?.offset || 0).toString(),
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'code,transactionDirection,transactionTypeId,transactionTypeName,name,status,totalPriceCurrency,totalPrice,warehouse,transactionDate,createdAt'
    });

    let whereGroupIndex = 0;

    // Přidání textového filtru pokud existuje
    if (filters?.searchText) {
      queryParams.append(`whereGroup[${whereGroupIndex}][type]`, 'textFilter');
      queryParams.append(`whereGroup[${whereGroupIndex}][value]`, wrapWithWildcards(filters.searchText));
      whereGroupIndex++;
    }

    // Filtr podle typu pohybu
    if (filters?.typeId) {
      queryParams.append(`whereGroup[${whereGroupIndex}][type]`, 'where');
      queryParams.append(`whereGroup[${whereGroupIndex}][column]`, 'transactionTypeId');
      queryParams.append(`whereGroup[${whereGroupIndex}][operator]`, '=');
      queryParams.append(`whereGroup[${whereGroupIndex}][value]`, filters.typeId);
      whereGroupIndex++;
    }

    // Filtr podle statusu
    if (filters?.status) {
      queryParams.append(`whereGroup[${whereGroupIndex}][type]`, 'where');
      queryParams.append(`whereGroup[${whereGroupIndex}][column]`, 'status');
      queryParams.append(`whereGroup[${whereGroupIndex}][operator]`, '=');
      queryParams.append(`whereGroup[${whereGroupIndex}][value]`, filters.status);
      whereGroupIndex++;
    }

    // Filtr podle směru pohybu
    // Pro enum pole se musí používat 'in' typ filtru s 'attribute' místo 'column'
    if (filters?.direction) {
      queryParams.append(`whereGroup[${whereGroupIndex}][type]`, 'in');
      queryParams.append(`whereGroup[${whereGroupIndex}][attribute]`, 'transactionDirection');
      queryParams.append(`whereGroup[${whereGroupIndex}][value][]`, filters.direction);
      whereGroupIndex++;
    }

    // Filtr podle data od
    if (filters?.dateFrom) {
      queryParams.append(`whereGroup[${whereGroupIndex}][type]`, 'where');
      queryParams.append(`whereGroup[${whereGroupIndex}][column]`, 'transactionDate');
      queryParams.append(`whereGroup[${whereGroupIndex}][operator]`, '>=');
      queryParams.append(`whereGroup[${whereGroupIndex}][value]`, filters.dateFrom);
      whereGroupIndex++;
    }

    // Filtr podle data do
    if (filters?.dateTo) {
      queryParams.append(`whereGroup[${whereGroupIndex}][type]`, 'where');
      queryParams.append(`whereGroup[${whereGroupIndex}][column]`, 'transactionDate');
      queryParams.append(`whereGroup[${whereGroupIndex}][operator]`, '<=');
      queryParams.append(`whereGroup[${whereGroupIndex}][value]`, filters.dateTo);
      whereGroupIndex++;
    }

    // Poznámka: Filtrování podle produktu (productId) se musí provádět po načtení,
    // protože je v related entitě (items). API to neumožňuje přímo.

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
  },

  /**
   * Načte transakce pro konkrétní produkt (pro grafy)
   * Vrací agregovaná data pro výdejky a příjemky v čase
   */
  async getByProductId(productId: string): Promise<InventoryTransaction[]> {
    const queryParams = new URLSearchParams({
      maxSize: '200',
      offset: '0',
      orderBy: 'transactionDate',
      order: 'asc'
    });

    // Filtrování podle produktu se provádí na backendu přes items relation
    console.log('📊 Getting transactions for product:', productId);

    try {
      const response = await apiClient.get<InventoryTransactionsResponse>(`/InventoryTransaction?${queryParams}`);

      // Načteme položky pro všechny transakce PARALELNĚ (místo sekvenčně)
      const itemsPromises = response.list.map(async (transaction) => {
        try {
          const items = await this.getItems(transaction.id);
          return { transaction, items };
        } catch (err) {
          console.warn(`Failed to load items for transaction ${transaction.id}:`, err);
          return { transaction, items: [] };
        }
      });

      // Počkáme na všechny requesty najednou
      const allResults = await Promise.all(itemsPromises);

      // Filtrujeme transakce, které obsahují daný produkt
      const transactionsWithProduct: InventoryTransaction[] = allResults
        .filter(({ items }) => items.some(item => item.productId === productId))
        .map(({ transaction, items }) => ({
          ...transaction,
          items: items.filter(item => item.productId === productId)
        }));

      return transactionsWithProduct;
    } catch (err) {
      console.error('❌ Error loading product transactions:', err);
      throw err;
    }
  }
};