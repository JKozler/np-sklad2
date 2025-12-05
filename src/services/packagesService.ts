// src/services/packagesService.ts
import { apiClient } from './apiClient';
import { wrapWithWildcards } from '@/utils/searchHelpers';

export type PackageStatus =
  | 'TO_PACK'      // K zabalení (default)
  | 'PACKED'       // Zabaleno
  | 'TO_RETURN'    // K vrácení
  | 'RETURNED'     // Vráceno
  | 'ERROR';       // Chyba

export interface Package {
  id: string;
  name: string;
  createdAt: string;
  salesOrderId: string;
  salesOrderName: string;
  carrierId: string;
  carrierName: string;
  shippingAddressFirstName: string;
  shippingAddressLastName: string;
  lastTrackingStatus: string | null;
  lastTrackingStatusNormalized: string;
  createdById: string;
  assignedUserId: string | null;
  status?: PackageStatus;
  errorMessage?: string;
  packageIssuedFlag?: boolean;
  packageReceivedFlag?: boolean;
}

export interface PackagesResponse {
  total: number;
  list: Package[];
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
  status?: PackageStatus;
  errorMessage?: string;
  packageIssuedFlag?: boolean;
  packageReceivedFlag?: boolean;
}

export interface PackageItem {
  id: string;
  salesOrderItemName: string;
  productName?: string | null;
  quantity: number;
  outageFlag?: boolean;
}

export const packagesService = {
  /**
   * Načte seznam balíků s možností vyhledávání
   * @param searchText - Textové vyhledávání
   * @param maxSize - Maximální počet položek na stránku
   * @param offset - Offset pro paginaci
   */
  async getAll(searchText?: string, maxSize: number = 20, offset: number = 0): Promise<PackagesResponse> {
    const queryParams = new URLSearchParams({
      maxSize: maxSize.toString(),
      offset: offset.toString(),
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'createdAt,name,salesOrderId,salesOrderName,carrierId,carrierName,shippingAddressFirstName,shippingAddressLastName,lastTrackingStatus,lastTrackingStatusNormalized'
    });

    // Přidat textový filtr pokud existuje
    if (searchText) {
      queryParams.append('whereGroup[0][type]', 'textFilter');
      queryParams.append('whereGroup[0][value]', wrapWithWildcards(searchText));
    }

    console.log('🔍 API Request:', `/Package?${queryParams}`);
    return apiClient.get<PackagesResponse>(`/Package?${queryParams}`);
  },

  /**
   * Načte detail balíku
   */
  async getById(id: string): Promise<PackageDetail> {
    console.log('🔍 Getting package:', id);
    return apiClient.get<PackageDetail>(`/Package/${id}`);
  },

  /**
   * Načte položky balíku
   */
  async getPackageItems(packageId: string): Promise<PackageItem[]> {
    const queryParams = new URLSearchParams({
      maxSize: '100',
      offset: '0'
    });

    console.log('📋 Getting package items:', packageId);
    const response = await apiClient.get<{ total: number; list: PackageItem[] }>(
      `/Package/${packageId}/packageItems?${queryParams}`
    );

    return response.list;
  },

  /**
   * Vrátí URL pro stažení štítku balíku
   */
  getLabelDownloadUrl(labelId: string): string {
    return `https://smart-be.naturalprotein.net/?entryPoint=download&id=${labelId}`;
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
