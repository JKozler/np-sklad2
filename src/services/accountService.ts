// src/services/accountService.ts
import { apiClient } from './apiClient';

export interface Account {
  id: string;
  name: string;
  deleted: boolean;
  website: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  type: string;
  industry: string | null;
  sicCode: string | null;
  billingAddressStreet: string | null;
  billingAddressCity: string | null;
  billingAddressState: string | null;
  billingAddressCountry: string | null;
  billingAddressPostalCode: string | null;
  shippingAddressStreet: string | null;
  shippingAddressCity: string | null;
  shippingAddressState: string | null;
  shippingAddressCountry: string | null;
  shippingAddressPostalCode: string | null;
  description: string | null;
  createdAt: string;
  modifiedAt: string | null;
  vatId: string | null;
  skVatId: string | null;
  emailAddressIsOptedOut: boolean;
  emailAddressIsInvalid: boolean;
  phoneNumberIsOptedOut: boolean;
  phoneNumberIsInvalid: boolean;
  streamUpdatedAt: string | null;
  emailAddressData: any[];
  phoneNumberData: any[];
  campaignId: string | null;
  campaignName: string | null;
  createdById: string;
  createdByName: string | null;
  modifiedById: string | null;
  modifiedByName: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  teamsIds: string[];
  teamsNames: Record<string, string>;
  originalLeadId: string | null;
  originalLeadName: string | null;
  isFollowed: boolean;
  followersIds: string[];
  followersNames: Record<string, string>;
  isStarred: boolean;
  versionNumber: number;
}

export interface AccountListItem {
  id: string;
  name: string;
  website: string | null;
  type: string;
  billingAddressCountry: string | null;
  createdAt: string;
  createdById: string;
  assignedUserId: string | null;
  isStarred: boolean;
}

export interface AccountsResponse {
  total: number;
  list: AccountListItem[];
}

export interface CreateAccountData {
  name: string;
  type: string;
  website?: string;
  emailAddress?: string;
  phoneNumber?: string;
  billingAddressStreet?: string;
  billingAddressCity?: string;
  billingAddressState?: string;
  billingAddressCountry?: string;
  billingAddressPostalCode?: string;
  description?: string;
  vatId?: string;
}

export interface UpdateAccountData {
  name?: string;
  type?: string;
  website?: string;
  emailAddress?: string;
  phoneNumber?: string;
  billingAddressStreet?: string;
  billingAddressCity?: string;
  billingAddressState?: string;
  billingAddressCountry?: string;
  billingAddressPostalCode?: string;
  description?: string;
  vatId?: string;
}

export interface AccountFilters {
  type?: string;
  searchText?: string;
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

class AccountService {
  private baseEndpoint = '/Account';

  /**
   * Načte seznam accountů s filtrováním
   */
  async getAll(filters: AccountFilters = {}): Promise<AccountsResponse> {
    const params = new URLSearchParams();

    if (filters.maxSize !== undefined) {
      params.append('maxSize', String(filters.maxSize));
    } else {
      params.append('maxSize', '20');
    }

    if (filters.offset !== undefined) {
      params.append('offset', String(filters.offset));
    } else {
      params.append('offset', '0');
    }

    if (filters.orderBy) {
      params.append('orderBy', filters.orderBy);
    } else {
      params.append('orderBy', 'createdAt');
    }

    if (filters.order) {
      params.append('order', filters.order);
    } else {
      params.append('order', 'desc');
    }

    if (filters.type) {
      params.append('whereGroup[0][type]', 'equals');
      params.append('whereGroup[0][attribute]', 'type');
      params.append('whereGroup[0][value]', filters.type);
    }

    if (filters.searchText) {
      const groupIndex = filters.type ? 1 : 0;
      params.append(`whereGroup[${groupIndex}][type]`, 'textFilter');
      params.append(`whereGroup[${groupIndex}][value]`, filters.searchText);
    }

    params.append('attributeSelect', 'name,website,type,billingAddressCountry');

    const url = `${this.baseEndpoint}?${params.toString()}`;
    console.log('📤 Account GET request:', url);

    const response = await apiClient.get<AccountsResponse>(url);
    console.log('✅ Account response:', response);

    return response;
  }

  /**
   * Načte detail accountu podle ID
   */
  async getById(id: string): Promise<Account> {
    const url = `${this.baseEndpoint}/${id}`;
    console.log('📤 Account GET by ID:', url);

    const response = await apiClient.get<Account>(url);
    console.log('✅ Account detail:', response);

    return response;
  }

  /**
   * Vytvoří nový account
   */
  async create(data: CreateAccountData): Promise<Account> {
    console.log('📤 Creating account:', data);

    const response = await apiClient.post<Account>(this.baseEndpoint, data);
    console.log('✅ Account created:', response);

    return response;
  }

  /**
   * Aktualizuje existující account
   */
  async update(id: string, data: UpdateAccountData): Promise<Account> {
    const url = `${this.baseEndpoint}/${id}`;
    console.log('📤 Updating account:', url, data);

    const response = await apiClient.put<Account>(url, data);
    console.log('✅ Account updated:', response);

    return response;
  }

  /**
   * Smaže account
   */
  async delete(id: string): Promise<void> {
    const url = `${this.baseEndpoint}/${id}`;
    console.log('📤 Deleting account:', url);

    await apiClient.delete<void>(url);
    console.log('✅ Account deleted');
  }

  /**
   * Načte pouze dodavatele (type=SUPPLIER)
   */
  async getSuppliers(filters: Omit<AccountFilters, 'type'> = {}): Promise<AccountsResponse> {
    return this.getAll({ ...filters, type: 'SUPPLIER' });
  }
}

export const accountService = new AccountService();
