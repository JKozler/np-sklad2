// src/composables/useAccountAutocomplete.ts
import { ref, watch } from 'vue';
import { accountService } from '@/services/accountService';
import type { AccountListItem } from '@/services/accountService';

/**
 * Composable pro autocomplete vyhledávání dodavatelů (Accounts)
 * Používá textFilter API pro dynamické vyhledávání
 */
export function useAccountAutocomplete() {
  const accounts = ref<AccountListItem[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const error = ref<string | null>(null);

  let searchTimeout: number | null = null;

  /**
   * Debounced search - čeká 300ms po posledním stisku klávesy
   */
  const searchAccounts = async (query: string) => {
    // Pokud je query prázdný nebo moc krátký, vyčisti výsledky
    if (!query || query.length < 2) {
      accounts.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Použij textFilter pro vyhledávání pouze dodavatelů
      const response = await accountService.getSuppliers({
        searchText: query.trim(),
        maxSize: 50,
        offset: 0,
        orderBy: 'name',
        order: 'asc'
      });

      accounts.value = response.list;
      console.log('🔍 Autocomplete: Nalezeno dodavatelů:', accounts.value.length, 'pro dotaz:', query);
    } catch (err: any) {
      error.value = err.message || 'Chyba při vyhledávání dodavatelů';
      console.error('❌ Autocomplete error:', err);
      accounts.value = [];
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
      accounts.value = [];
      loading.value = false;
      return;
    }

    // Nastav nový timeout
    loading.value = true;
    searchTimeout = window.setTimeout(() => {
      searchAccounts(newQuery);
    }, 300);
  });

  /**
   * Načte konkrétní account podle ID (pro předvyplnění)
   */
  const loadAccountById = async (accountId: string): Promise<AccountListItem | null> => {
    try {
      const account = await accountService.getById(accountId);
      return {
        id: account.id,
        name: account.name,
        website: account.website,
        type: account.type,
        billingAddressCountry: account.billingAddressCountry,
        createdAt: account.createdAt,
        createdById: account.createdById,
        assignedUserId: account.assignedUserId,
        isStarred: account.isStarred
      };
    } catch (err) {
      console.error('❌ Error loading account:', err);
      return null;
    }
  };

  /**
   * Vyčistí vyhledávání
   */
  const clearSearch = () => {
    searchQuery.value = '';
    accounts.value = [];
    error.value = null;
  };

  return {
    accounts,
    loading,
    searchQuery,
    error,
    searchAccounts,
    loadAccountById,
    clearSearch
  };
}
