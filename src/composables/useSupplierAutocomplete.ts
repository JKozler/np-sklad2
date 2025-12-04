// src/composables/useSupplierAutocomplete.ts
import { ref, watch } from 'vue';
import { accountService } from '@/services/accountService';
import type { AccountListItem } from '@/services/accountService';

/**
 * Composable pro autocomplete vyhledávání dodavatelů
 * Používá textFilter API pro dynamické vyhledávání
 */
export function useSupplierAutocomplete() {
  const suppliers = ref<AccountListItem[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const error = ref<string | null>(null);

  let searchTimeout: number | null = null;

  /**
   * Debounced search - čeká 300ms po posledním stisku klávesy
   */
  const searchSuppliers = async (query: string) => {
    // Pokud je query prázdný nebo moc krátký, vyčisti výsledky
    if (!query || query.length < 2) {
      suppliers.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Použij textFilter pro vyhledávání dodavatelů
      const response = await accountService.getSuppliers({
        maxSize: 50, // Omez na 50 výsledků
        offset: 0,
        orderBy: 'name',
        order: 'asc',
        searchText: query.trim()
      });

      suppliers.value = response.list;
      console.log('🔍 Supplier Autocomplete: Nalezeno dodavatelů:', suppliers.value.length, 'pro dotaz:', query);
    } catch (err: any) {
      error.value = err.message || 'Chyba při vyhledávání dodavatelů';
      console.error('❌ Supplier Autocomplete error:', err);
      suppliers.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Watch na změnu searchQuery s debounce
   */
  watch(searchQuery, (newQuery) => {
    // Vyčisti timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Pokud je query prázdný, vyčisti výsledky okamžitě
    if (!newQuery || newQuery.length < 2) {
      suppliers.value = [];
      loading.value = false;
      return;
    }

    // Nastav nový timeout
    loading.value = true;
    searchTimeout = window.setTimeout(() => {
      searchSuppliers(newQuery);
    }, 300);
  });

  /**
   * Načte konkrétního dodavatele podle ID (pro předvyplnění)
   */
  const loadSupplierById = async (supplierId: string) => {
    try {
      const supplier = await accountService.getById(supplierId);
      return supplier;
    } catch (err) {
      console.error('❌ Error loading supplier:', err);
      return null;
    }
  };

  /**
   * Vyčistí vyhledávání
   */
  const clearSearch = () => {
    searchQuery.value = '';
    suppliers.value = [];
    error.value = null;
  };

  return {
    suppliers,
    loading,
    searchQuery,
    error,
    searchSuppliers,
    loadSupplierById,
    clearSearch
  };
}
