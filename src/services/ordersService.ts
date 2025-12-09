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

export type PackageStatus =
  | 'TO_PACK'      // K zabalení (default)
  | 'PACKED'       // Zabaleno
  | 'TO_RETURN'    // K vrácení
  | 'RETURNED'     // Vráceno
  | 'ERROR';       // Chyba

export type SalesOrderItemType =
  | 'PRODUCT'      // Normální produkt
  | 'BUNDLE'       // Bundle kontejner
  | 'NON_PRODUCT'; // Poukazy, COD surcharge, atd.

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
  eshopId?: string; // Nový atribut
  bundleId?: string | null; // ID bundle kontejneru
  bundleName?: string | null; // Název bundlu
  type?: SalesOrderItemType; // Typ položky
  outageFlag?: boolean; // Indikuje nedostupný produkt
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
  eshopId?: string; // Nový atribut
  flagPackageCreated?: boolean; // Flag zda byl balík vytvořen
  packageErrorMessage?: string; // Chybová zpráva balíku
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

export interface OrderFilters {
  status?: string[];
  carrierId?: string;
  email?: string;
  priceMin?: number;
  priceMax?: number;
  paymentMethod?: string[];
  customerName?: string;
}

export interface OrderQueryParams {
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  [key: string]: any; // Pro whereGroup parametry
}

export interface StreamEntry {
  id: string;
  deleted: boolean;
  post: string | null;
  data: {
    fields?: string[];
    attributes?: {
      was?: Record<string, any>;
      became?: Record<string, any>;
    };
  };
  type: string;
  targetType: string | null;
  number: number;
  isGlobal: boolean;
  createdByGender: string | null;
  isInternal: boolean;
  isPinned: boolean;
  reactionCounts: any | null;
  myReactions: any[];
  createdAt: string;
  modifiedAt: string;
  parentId: string;
  parentType: string;
  relatedId: string | null;
  relatedType: string | null;
  createdById: string;
  createdByName: string;
  modifiedById: string | null;
  modifiedByName: string | null;
  superParentId: string | null;
  superParentType: string | null;
}

export interface StreamResponse {
  total: number;
  list: StreamEntry[];
  pinnedList: StreamEntry[];
}

export interface Package {
  id: string;
  name: string;
  createdAt: string;
  trackingDetails: any[];
  boxCount: number;
  lastTrackingStatus: string | null;
  lastTrackingStatusNormalized: string;
  createdById: string;
  assignedUserId: string | null;
  status?: PackageStatus; // Nový atribut - stav balíku
  errorMessage?: string; // Nový atribut - důvod erroru
  packageIssuedFlag?: boolean; // Nový atribut - flag jestli proběhla výdejka
  packageReceivedFlag?: boolean; // Nový atribut - flag jestli proběhla příjemka vratky
}

export interface PackagesResponse {
  total: number;
  list: Package[];
}

export interface PackageItem {
  id: string;
  salesOrderItemName: string;
  productName?: string | null;
  quantity: number;
  outageFlag?: boolean; // Nový atribut - zda produkt chybí na skladě
}

export interface PackageDetail {
  id: string;
  name: string;
  deleted: boolean;
  description: string | null;
  createdAt: string;
  modifiedAt: string;
  paymentMethod: string;
  shippingAddressFirstName: string;
  shippingAddressLastName: string;
  shippingAddressStreet: string;
  shippingAddressCity: string;
  shippingAddressCountry: string;
  shippingAddressPostalCode: string;
  carrierPickupPoint: string;
  trackingDetails: any[];
  boxCount: number;
  lastTrackingStatus: string | null;
  lastTrackingStatusNormalized: string;
  codAmount: number;
  email: string;
  phoneNumber: string;
  value: number;
  internalNumber: string;
  codAmountCurrency: string;
  valueCurrency: string;
  createdById: string;
  createdByName: string;
  modifiedById: string;
  modifiedByName: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  teamsIds: string[];
  teamsNames: Record<string, string>;
  salesOrderId: string;
  salesOrderName: string;
  carrierId: string;
  carrierName: string;
  labelId: string;
  labelName: string;
  codAmountConverted: number;
  valueConverted: number;
  status?: PackageStatus; // Nový atribut - stav balíku
  errorMessage?: string; // Nový atribut - důvod erroru
  packageIssuedFlag?: boolean; // Nový atribut - flag jestli proběhla výdejka
  packageReceivedFlag?: boolean; // Nový atribut - flag jestli proběhla příjemka vratky
  warehouseWorkerId?: string | null; // Nový atribut - ID skladníka
  warehouseWorkerName?: string | null; // Nový atribut - jméno skladníka
  expeditionDate?: string | null; // Nový atribut - datum expedice
}

export const ordersService = {
  /**
   * Načte seznam objednávek s možností vyhledávání a filtrování
   * @param searchText - Textové vyhledávání
   * @param primaryFilter - Primární filtr (např. 'starred' pro oblíbené, 'errors' pro chybové)
   * @param filters - Pokročilé filtry (status, dopravce, cena, atd.)
   * @param params - Query parametry včetně whereGroup
   */
  async getAll(
    searchText?: string,
    primaryFilter?: string,
    filters?: OrderFilters,
    params?: OrderQueryParams
  ): Promise<SalesOrdersResponse> {
    const queryParams: any = {
      maxSize: (params?.maxSize || 200).toString(),
      offset: (params?.offset || 0).toString(),
      orderBy: params?.orderBy || 'createdAt',
      order: params?.order || 'desc'
    };

    let whereGroupIndex = 0;

    // Přidat primární filtr pokud existuje
    if (primaryFilter === 'errors') {
      // Speciální filtr pro chybové objednávky
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'in';
      queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'status';
      queryParams[`whereGroup[${whereGroupIndex}][value][]`] = 'expedition-error';
      queryParams[`whereGroup[${whereGroupIndex}][value][]`] = 'data-error';
      whereGroupIndex++;
    } else if (primaryFilter) {
      // Standardní primární filtr (např. starred)
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'primary';
      queryParams[`whereGroup[${whereGroupIndex}][value]`] = primaryFilter;
      whereGroupIndex++;
    }

    // Přidat textový filtr pokud existuje
    if (searchText) {
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'textFilter';
      queryParams[`whereGroup[${whereGroupIndex}][value]`] = wrapWithWildcards(searchText);
      whereGroupIndex++;
    }

    // **NOVÉ: Pokročilé filtry**
    if (filters) {
      // Filtr podle statusu (in - pole hodnot)
      if (filters.status && filters.status.length > 0) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'in';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'status';
        filters.status.forEach(status => {
          queryParams[`whereGroup[${whereGroupIndex}][value][]`] = status;
        });
        whereGroupIndex++;
      }

      // Filtr podle dopravce (equals)
      if (filters.carrierId) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'equals';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'carrierId';
        queryParams[`whereGroup[${whereGroupIndex}][value]`] = filters.carrierId;
        whereGroupIndex++;
      }

      // Filtr podle emailu (startsWith)
      if (filters.email) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'startsWith';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'email';
        queryParams[`whereGroup[${whereGroupIndex}][value]`] = filters.email;
        whereGroupIndex++;
      }

      // Filtr podle jména zákazníka (contains v shippingAddressFirstName nebo shippingAddressLastName)
      if (filters.customerName) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'or';
        queryParams[`whereGroup[${whereGroupIndex}][value][0][type]`] = 'contains';
        queryParams[`whereGroup[${whereGroupIndex}][value][0][attribute]`] = 'shippingAddressFirstName';
        queryParams[`whereGroup[${whereGroupIndex}][value][0][value]`] = filters.customerName;
        queryParams[`whereGroup[${whereGroupIndex}][value][1][type]`] = 'contains';
        queryParams[`whereGroup[${whereGroupIndex}][value][1][attribute]`] = 'shippingAddressLastName';
        queryParams[`whereGroup[${whereGroupIndex}][value][1][value]`] = filters.customerName;
        whereGroupIndex++;
      }

      // Filtr podle minimální ceny (greaterThan)
      if (filters.priceMin !== undefined && filters.priceMin > 0) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'greaterThan';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'priceWithVat';
        queryParams[`whereGroup[${whereGroupIndex}][value]`] = filters.priceMin.toString();
        whereGroupIndex++;
      }

      // Filtr podle maximální ceny (lessThan)
      if (filters.priceMax !== undefined && filters.priceMax > 0) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'lessThan';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'priceWithVat';
        queryParams[`whereGroup[${whereGroupIndex}][value]`] = filters.priceMax.toString();
        whereGroupIndex++;
      }

      // Filtr podle platební metody (in - pole hodnot)
      if (filters.paymentMethod && filters.paymentMethod.length > 0) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'in';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'paymentMethod';
        filters.paymentMethod.forEach(method => {
          queryParams[`whereGroup[${whereGroupIndex}][value][]`] = method;
        });
        whereGroupIndex++;
      }
    }

    // Pokud jsou v params whereGroup parametry, přidáme je
    if (params) {
      Object.keys(params).forEach(key => {
        if (key.startsWith('whereGroup')) {
          queryParams[key] = params[key];
        }
      });
    }

    // Sestavení URL parametrů
    const urlParams = new URLSearchParams();
    urlParams.append('maxSize', queryParams.maxSize);
    urlParams.append('offset', queryParams.offset);
    urlParams.append('orderBy', queryParams.orderBy);
    urlParams.append('order', queryParams.order);
    urlParams.append('attributeSelect', 'name,priceWithVat,currency,shippingAddressLastName,shippingAddressFirstName,status,carrierId,carrierName,createdAt,isStarred,email,paymentMethod');

    // Přidat whereGroup parametry
    Object.keys(queryParams).forEach(key => {
      if (key.startsWith('whereGroup')) {
        urlParams.append(key, queryParams[key]);
      }
    });

    console.log('🔍 API Request:', `/SalesOrder?${urlParams}`);
    return apiClient.get<SalesOrdersResponse>(`/SalesOrder?${urlParams}`);
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
      maxSize: '200',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'productId,productName,name,quantity,unitPrice,priceWithoutVat,vatRate,priceWithVat,bundleId,bundleName,type,outageFlag'
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
  },

  /**
   * Načte stream/log objednávky
   */
  async getOrderStream(orderId: string): Promise<StreamResponse> {
    const queryParams = new URLSearchParams({
      filter: '',
      maxSize: '20',
      offset: '0',
      orderBy: 'number',
      order: 'desc'
    });

    console.log('📝 Getting order stream:', orderId);
    return apiClient.get<StreamResponse>(`/SalesOrder/${orderId}/stream?${queryParams}`);
  },

  /**
   * Načte balíky objednávky
   */
  async getOrderPackages(orderId: string): Promise<PackagesResponse> {
    const queryParams = new URLSearchParams({
      primaryFilter: '',
      maxSize: '20',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'name,trackingDetails,lastTrackingStatus,boxCount,lastTrackingStatusNormalized'
    });

    console.log('📦 Getting order packages:', orderId);
    return apiClient.get<PackagesResponse>(`/SalesOrder/${orderId}/packages?${queryParams}`);
  },

  /**
   * Načte detail balíku
   */
  async getPackageDetail(packageId: string): Promise<PackageDetail> {
    console.log('📦 Getting package detail:', packageId);
    return apiClient.get<PackageDetail>(`/Package/${packageId}`);
  },

  /**
   * Vrátí URL pro stažení štítku balíku
   */
  getLabelDownloadUrl(labelId: string): string {
    return `https://smart-be.naturalprotein.net/?entryPoint=download&id=${labelId}`;
  },

  /**
   * Přegeneruje balík pro objednávku
   */
  async regeneratePackage(orderId: string): Promise<any> {
    console.log('🔄 Regenerating package for order:', orderId);
    return apiClient.post(`/SalesOrder/${orderId}/regeneratePackage`, {});
  },

  /**
   * Načte balík objednávky pro split operaci
   */
  async getPackageForSplit(salesOrderId: string): Promise<PackageDetail> {
    const queryParams = new URLSearchParams({
      'whereGroup[0][type]': 'equals',
      'whereGroup[0][attribute]': 'salesOrderId',
      'whereGroup[0][value]': salesOrderId
    });

    console.log('📦 Getting package for split:', salesOrderId);
    const response = await apiClient.get<{ total: number; list: PackageDetail[] }>(
      `/Package?${queryParams}`
    );

    if (response.total === 0 || !response.list[0]) {
      throw new Error('Balík nenalezen');
    }

    return response.list[0];
  },

  /**
   * Načte položky balíku
   */
  async getPackageItems(packageId: string): Promise<any[]> {
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0'
    });

    console.log('📋 Getting package items:', packageId);
    const response = await apiClient.get<{ total: number; list: any[] }>(
      `/Package/${packageId}/packageItems?${queryParams}`
    );

    return response.list;
  },

  /**
   * Rozdělí balík
   */
  async splitPackage(packageId: string, itemsToMove: string[], overrides: any[] = []): Promise<any> {
    console.log('✂️ Splitting package:', packageId, { itemsToMove, overrides });
    return apiClient.post(`/Package/${packageId}/split`, {
      itemsToMove,
      overrides
    });
  },

  /**
   * Označí balík jako zabalený (TO_PACK -> PACKED)
   */
  async markPackageAsPacked(packageId: string): Promise<any> {
    console.log('📦 Marking package as packed:', packageId);
    return apiClient.post(`/Package/${packageId}/markAsPacked`, {});
  },

  /**
   * Příjme vratku (TO_RETURN -> RETURNED)
   */
  async receiveReturn(packageId: string): Promise<any> {
    console.log('📥 Receiving return for package:', packageId);
    return apiClient.post(`/Package/${packageId}/receiveReturn`, {});
  },

  /**
   * Předá balík do expedice (ERROR -> TO_PACK)
   */
  async sendToExpedition(packageId: string): Promise<any> {
    console.log('🚚 Sending package to expedition:', packageId);
    return apiClient.post(`/Package/${packageId}/sendToExpedition`, {});
  }
};