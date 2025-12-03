// src/services/purchaseRequestService.ts
import { apiClient } from './apiClient';

export interface PurchaseRequest {
  id: string;
  name: string;
  createdAt: string;
  status: 'New' | 'Ignored' | 'Purchased' | 'Done';
  expectedDate?: string | null;
  ignoredUntil?: string | null;
  ignoredReason?: string | null;
  descriptionSmall?: string;
  createdById: string;
  assignedUserId?: string | null;
}

export interface PurchaseRequestsResponse {
  total: number;
  list: PurchaseRequest[];
}

export interface PurchaseRequestFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

class PurchaseRequestService {
  private baseUrl = '/PurchaseRequest';

  /**
   * Načte všechny nákupní žádosti s filtry
   */
  async getAll(filters?: PurchaseRequestFilters, queryParams?: Record<string, any>): Promise<PurchaseRequestsResponse> {
    const params = new URLSearchParams();

    // Výchozí parametry
    params.append('select', 'createdAt,ignoredReason,ignoredUntil,expectedDate,status,descriptionSmall,name');
    params.append('maxSize', queryParams?.maxSize?.toString() || '100');
    params.append('offset', queryParams?.offset?.toString() || '0');
    params.append('orderBy', queryParams?.orderBy || 'expectedDate');
    params.append('order', queryParams?.order || 'asc');

    // Přidání filtrů
    if (filters?.status) {
      params.append('where[0][type]', 'equals');
      params.append('where[0][attribute]', 'status');
      params.append('where[0][value]', filters.status);
    }

    if (filters?.search) {
      params.append('where[1][type]', 'contains');
      params.append('where[1][attribute]', 'name');
      params.append('where[1][value]', filters.search);
    }

    // Vlastní query params
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (!['maxSize', 'offset', 'orderBy', 'order'].includes(key) && value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<PurchaseRequestsResponse>(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  /**
   * Načte jednu nákupní žádost podle ID
   */
  async getById(id: string): Promise<PurchaseRequest> {
    const response = await apiClient.get<PurchaseRequest>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Aktualizuje status nákupní žádosti
   */
  async updateStatus(id: string, status: PurchaseRequest['status'], data?: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    const response = await apiClient.patch<PurchaseRequest>(`${this.baseUrl}/${id}`, {
      status,
      ...data
    });
    return response.data;
  }

  /**
   * Ignoruje nákupní žádost
   */
  async ignore(id: string, ignoredReason?: string, ignoredUntil?: string): Promise<PurchaseRequest> {
    return this.updateStatus(id, 'Ignored', {
      ignoredReason,
      ignoredUntil
    });
  }

  /**
   * Označí jako objednáno
   */
  async markAsPurchased(id: string, expectedDate?: string): Promise<PurchaseRequest> {
    return this.updateStatus(id, 'Purchased', {
      expectedDate
    });
  }

  /**
   * Označí jako hotovo
   */
  async markAsDone(id: string): Promise<PurchaseRequest> {
    return this.updateStatus(id, 'Done');
  }

  /**
   * Vrátí z Ignored zpět do New
   */
  async unignore(id: string): Promise<PurchaseRequest> {
    return this.updateStatus(id, 'New', {
      ignoredReason: null,
      ignoredUntil: null
    });
  }
}

export const purchaseRequestService = new PurchaseRequestService();
