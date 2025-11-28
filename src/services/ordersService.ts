// src/services/ordersService.ts
import { apiClient } from './apiClient';
import { wrapWithWildcards } from '@/utils/searchHelpers';

export type OrderStatus = 
  | 'new' 
  | 'in-progress' 
  | 'expedition-error' 
  | 'data-error' 
  | 'sent' 
  | 'return' 
  | 'delivered' 
  | 'cancelled';

export interface SalesOrderItem {
  id: string;
  name: string;
  createdAt: string;
  quantity: number;
  vatRate: number;
  unitPrice: number;
  priceWithoutVat: number;
  priceWithVat: number;
  createdById: string;
  assignedUserId: string | null;
  productId: string | null;
  productName: string | null;
}

export interface SalesOrder {
  id: string;
  name: string;
  deleted?: boolean;
  description?: string | null;
  createdAt: string;
  modifiedAt?: string;
  status: OrderStatus;
  priceWithoutVat?: number;
  priceWithVat: number;
  paymentMethod?: string;
  shippingAddressFirstName: string;
  shippingAddressLastName: string;
  shippingAddressStreet?: string;
  shippingAddressCity?: string;
  shippingAddressCountry?: string;
  shippingAddressPostalCode?: string;
  billingAddressFirstName?: string;
  billingAddressLastName?: string;
  billingAddressStreet?: string;
  billingAddressCity?: string;
  billingAddressCountry?: string;
  billingAddressPostalCode?: string;
  billingAddressCompanyName?: string | null;
  channel?: string;
  customerNote?: string;
  internalNote?: string;
  currency: string;
  email?: string;
  phoneNumber?: string;
  carrierPickupPoint?: string;
  streamUpdatedAt?: string;
  createdById: string;
  createdByName?: string;
  modifiedById?: string | null;
  modifiedByName?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
  carrierId?: string;
  carrierName?: string;
  warehouseWorkerId?: string | null;
  warehouseWorkerName?: string | null;
  isFollowed?: boolean;
  followersIds?: string[];
  followersNames?: Record<string, string>;
  isStarred?: boolean;
}

export interface SalesOrdersResponse {
  total: number;
  list: SalesOrder[];
}

export interface SalesOrderItemsResponse {
  total: number;
  list: SalesOrderItem[];
}

export interface UpdateOrderData {
  status?: OrderStatus;
  assignedUserId?: string | null;
  internalNote?: string;
  customerNote?: string;
  isStarred?: boolean;
  // Shipping address
  shippingAddressFirstName?: string;
  shippingAddressLastName?: string;
  shippingAddressStreet?: string;
  shippingAddressCity?: string;
  shippingAddressPostalCode?: string;
  shippingAddressCountry?: string;
  // Billing address
  billingAddressFirstName?: string;
  billingAddressLastName?: string;
  billingAddressStreet?: string;
  billingAddressCity?: string;
  billingAddressPostalCode?: string;
  billingAddressCountry?: string;
  billingAddressCompanyName?: string | null;
  // Contact
  email?: string;
  phoneNumber?: string;
  // Other
  paymentMethod?: string;
  carrierPickupPoint?: string;
}

export const ordersService = {
  /**
   * Načte seznam objednávek s možností vyhledávání a filtrování
   * @param searchText - Textové vyhledávání
   * @param primaryFilter - Primární filtr (např. 'starred' pro oblíbené, 'errors' pro chybové)
   */
  async getAll(searchText?: string, primaryFilter?: string): Promise<SalesOrdersResponse> {
    const queryParams = new URLSearchParams({
      maxSize: '20',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'name,priceWithVat,currency,shippingAddressLastName,shippingAddressFirstName,status,carrierId,carrierName,createdAt,isStarred'
    });

    // Přidat primární filtr pokud existuje
    if (primaryFilter === 'errors') {
      // Speciální filtr pro chybové objednávky
      queryParams.append('whereGroup[0][type]', 'in');
      queryParams.append('whereGroup[0][attribute]', 'status');
      queryParams.append('whereGroup[0][value][]', 'expedition-error');
      queryParams.append('whereGroup[0][value][]', 'data-error');
    } else if (primaryFilter) {
      // Standardní primární filtr (např. starred)
      queryParams.append('whereGroup[0][type]', 'primary');
      queryParams.append('whereGroup[0][value]', primaryFilter);
    }

    // Přidat textový filtr pokud existuje
    if (searchText) {
      const groupIndex = primaryFilter ? '1' : '0';
      queryParams.append(`whereGroup[${groupIndex}][type]`, 'textFilter');
      queryParams.append(`whereGroup[${groupIndex}][value]`, wrapWithWildcards(searchText));
    }

    console.log('🔍 API Request:', `/SalesOrder?${queryParams}`);
    return apiClient.get<SalesOrdersResponse>(`/SalesOrder?${queryParams}`);
  },

  /**
   * Načte detail objednávky
   */
  async getById(id: string): Promise<SalesOrder> {
    console.log('🔍 Getting order:', id);
    return apiClient.get<SalesOrder>(`/SalesOrder/${id}`);
  },

  /**
   * Načte položky objednávky
   */
  async getOrderItems(orderId: string): Promise<SalesOrderItem[]> {
    const queryParams = new URLSearchParams({
      primaryFilter: '',
      maxSize: '100',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'productId,productName,name,quantity,unitPrice,priceWithoutVat,vatRate,priceWithVat'
    });

    console.log('📋 Getting order items:', orderId);
    const response = await apiClient.get<SalesOrderItemsResponse>(
      `/SalesOrder/${orderId}/salesOrderItems?${queryParams}`
    );
    
    return response.list;
  },

  /**
   * Aktualizuje objednávku
   */
  async update(id: string, data: UpdateOrderData): Promise<SalesOrder> {
    console.log('✏️ Updating order:', id, data);
    return apiClient.put<SalesOrder>(`/SalesOrder/${id}`, data);
  },

  /**
   * Změní status objednávky
   */
  async updateStatus(id: string, status: OrderStatus): Promise<SalesOrder> {
    return this.update(id, { status });
  },

  /**
   * Označí/odznačí objednávku jako hvězdičkovou
   * Používá speciální endpoint pro star subscription
   */
  async toggleStar(id: string, isStarred: boolean): Promise<void> {
    console.log('⭐ Toggling star for order:', id, isStarred);
    if (isStarred) {
      await apiClient.put(`/SalesOrder/${id}/starSubscription`, {});
    } else {
      await apiClient.delete(`/SalesOrder/${id}/starSubscription`);
    }
  },

  /**
   * Smaže objednávku
   */
  async delete(id: string): Promise<void> {
    console.log('🗑️ Deleting order:', id);
    await apiClient.delete(`/SalesOrder/${id}`);
  }
};