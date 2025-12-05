// src/composables/useProductionWorkerAutocomplete.ts
import { ref, watch } from 'vue';
import { productionWorkerService } from '@/services/productionWorkerService';
import type { ProductionWorker } from '@/services/productionWorkerService';
import { wrapWithWildcards } from '@/utils/searchHelpers';

/**
 * Composable pro autocomplete vyhledávání pracovníků výroby
 * Používá textFilter API pro dynamické vyhledávání
 */
export function useProductionWorkerAutocomplete() {
  const workers = ref<ProductionWorker[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const error = ref<string | null>(null);

  let searchTimeout: number | null = null;

  /**
   * Debounced search - čeká 300ms po posledním stisku klávesy
   */
  const searchWorkers = async (query: string) => {
    // Pokud je query prázdný nebo moc krátký, načti všechny
    if (!query || query.length < 2) {
      await loadAllWorkers();
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Použij textFilter pro vyhledávání
      const response = await productionWorkerService.getAll({
        maxSize: 50,
        offset: 0,
        orderBy: 'name',
        order: 'asc',
        'whereGroup[0][type]': 'textFilter',
        'whereGroup[0][value]': wrapWithWildcards(query.trim())
      } as any);

      workers.value = response.list;
      console.log('🔍 Autocomplete: Nalezeno pracovníků:', workers.value.length, 'pro dotaz:', query);
    } catch (err: any) {
      error.value = err.message || 'Chyba při vyhledávání pracovníků';
      console.error('❌ Autocomplete error:', err);
      workers.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Načte všechny pracovníky
   */
  const loadAllWorkers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await productionWorkerService.getAll({
        maxSize: 100,
        offset: 0,
        orderBy: 'name',
        order: 'asc'
      });

      workers.value = response.list;
      console.log('✅ Načteno pracovníků:', workers.value.length);
    } catch (err: any) {
      error.value = err.message || 'Chyba při načítání pracovníků';
      console.error('❌ Error loading workers:', err);
      workers.value = [];
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

    // Pokud je query prázdný, načti všechny okamžitě
    if (!newQuery || newQuery.length < 2) {
      loadAllWorkers();
      return;
    }

    // Nastav nový timeout
    loading.value = true;
    searchTimeout = window.setTimeout(() => {
      searchWorkers(newQuery);
    }, 300);
  });

  /**
   * Načte konkrétního pracovníka podle ID
   */
  const loadWorkerById = async (workerId: string): Promise<ProductionWorker | null> => {
    try {
      const worker = await productionWorkerService.getById(workerId);
      return worker;
    } catch (err) {
      console.error('❌ Error loading worker:', err);
      return null;
    }
  };

  /**
   * Vyčistí vyhledávání
   */
  const clearSearch = () => {
    searchQuery.value = '';
    workers.value = [];
    error.value = null;
  };

  return {
    workers,
    loading,
    searchQuery,
    error,
    searchWorkers,
    loadAllWorkers,
    loadWorkerById,
    clearSearch
  };
}
