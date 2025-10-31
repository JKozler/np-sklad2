// src/services/inventoryTransactionService.ts
import { apiClient } from './apiClient';

export interface InventoryTransactionItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  price?: number;
  totalPrice?: number;
  notes?: string;
 inventoryTransactionId?: string;
}

export interface InventoryTransaction {
  id: string;
  name: string;
  inventoryTransactionTypeId: string;
  inventoryTransactionTypeName?: string;
  warehouseFromId?: string | null;
  warehouseFromName?: string | null;
  warehouseToId?: string | null;
  warehouseToName?: string | null;
  transactionDate: string;
  status?: string;
  notes?: string;
  totalAmount?: number;
  createdAt: string;
  modifiedAt?: string;
  createdById: string;
  createdByName?: string;
}

export interface InventoryTransactionsResponse {
  total: number;
  list: InventoryTransaction[];
}

export interface CreateInventoryTransactionData {
  name: string;
  inventoryTransactionTypeId: string;
  warehouseFromId?: string | null;
  warehouseToId?: string | null;
  transactionDate: string;
  notes?: string;
}

export interface UpdateInventoryTransactionData {
  name?: string;
  inventoryTransactionTypeId?: string;
  warehouseFromId?: string | null;
  warehouseToId?: string | null;
  transactionDate?: string;
  notes?: string;
  status?: string;
}

export const inventoryTransactionService = {
    async getAll(filters?: {
        typeId?: string;
        warehouseId?: string;
        dateFrom?: string;
        dateTo?: string;
      }): Promise<InventoryTransactionsResponse> {
        const queryParams = new URLSearchParams({
          maxSize: '200',
          offset: '0',
          order: 'desc'
        });
        return apiClient.get<InventoryTransactionsResponse>(`/InventoryTransaction?${queryParams}`);
      },

  async getById(id: string): Promise<InventoryTransaction> {
    return apiClient.get<InventoryTransaction>(`/InventoryTransaction/${id}`);
  },

  async create(data: CreateInventoryTransactionData): Promise<InventoryTransaction> {
    console.log('➕ Creating inventory transaction:', data);
    return apiClient.post<InventoryTransaction>('/InventoryTransaction', data);
  },

  async update(id: string, data: UpdateInventoryTransactionData): Promise<InventoryTransaction> {
    console.log('✏️ Updating inventory transaction:', id, data);
    return apiClient.put<InventoryTransaction>(`/InventoryTransaction/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting inventory transaction:', id);
    await apiClient.delete(`/InventoryTransaction/${id}`);
  },

  // Items management (přes bottom panel)
  async addItem(transactionId: string, item: InventoryTransactionItem): Promise<any> {
    console.log('➕ Adding item to transaction:', transactionId, item);
    // Endpoint bude asi něco jako:
    item.inventoryTransactionId = transactionId;
    return apiClient.post(`/InventoryTransactionItem`, item);
  },

  async updateItem(transactionId: string, itemId: string, item: Partial<InventoryTransactionItem>): Promise<any> {
    console.log('✏️ Updating transaction item:', transactionId, itemId, item);
    item.inventoryTransactionId = transactionId;
    return apiClient.put(`/InventoryTransactionItem/${itemId}`, item);
  },

  async deleteItem(transactionId: string, itemId: string): Promise<void> {
    console.log('🗑️ Deleting transaction item:', transactionId, itemId);
    await apiClient.delete(`/InventoryTransaction/${transactionId}/items/${itemId}`);
  },

  async getItems(transactionId: string): Promise<InventoryTransactionItem[]> {
    console.log('📋 Getting transaction items:', transactionId);
    const response = await apiClient.get<{ list: InventoryTransactionItem[] }>(`/InventoryTransaction/${transactionId}/items`);
    return response.list;
  }
};