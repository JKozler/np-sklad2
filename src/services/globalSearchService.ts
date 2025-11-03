// src/services/globalSearchService.ts
import { apiClient } from './apiClient';

export interface GlobalSearchResult {
  id: string;
  name: string;
  entityType: string;
  [key: string]: any;
}

export interface GlobalSearchResponse {
  total: number;
  list: GlobalSearchResult[];
}

export interface GlobalSearchParams {
  q: string;
  maxSize?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export const globalSearchService = {
  /**
   * Globální vyhledávání napříč všemi entitami
   * @param params - Parametry vyhledávání
   * @returns Seznam nalezených výsledků
   */
  async search(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
    const queryParams = new URLSearchParams({
      q: params.q,
      maxSize: (params.maxSize || 10).toString(),
      offset: (params.offset || 0).toString(),
      orderBy: params.orderBy || '',
      order: params.order || ''
    });

    console.log('🔍 Global Search:', `/GlobalSearch?${queryParams}`);

    return apiClient.get<GlobalSearchResponse>(`/GlobalSearch?${queryParams}`);
  }
};