// src/composables/useProductAutocomplete.ts
import { ref, watch } from 'vue';
import { productsService } from '@/services/productsService';
import type { Product } from '@/services/productsService';

/**
 * Composable pro autocomplete vyhledávání produktů
 * Používá textFilter API pro dynamické vyhledávání
 */
export function useProductAutocomplete() {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const error = ref<string | null>(null);

  let searchTimeout: number | null = null;

  /**
   * Debounced search - čeká 300ms po posledním stisku klávesy
   */
  const searchProducts = async (query: string) => {
    // Pokud je query prázdný nebo moc krátký, vyčisti výsledky
    if (!query || query.length < 2) {
      products.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Použij textFilter pro vyhledávání
      const response = await productsService.getAll(undefined, {
        maxSize: 50, // Omez na 50 výsledků
        offset: 0,
        orderBy: 'name',
        order: 'asc',
        'whereGroup[0][type]': 'textFilter',
        'whereGroup[0][value]': query.trim()
      } as any);

      products.value = response.list;
      console.log('🔍 Autocomplete: Nalezeno produktů:', products.value.length, 'pro dotaz:', query);
    } catch (err: any) {
      error.value = err.message || 'Chyba při vyhledávání produktů';
      console.error('❌ Autocomplete error:', err);
      products.value = [];
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
      products.value = [];
      loading.value = false;
      return;
    }

    // Nastav nový timeout
    loading.value = true;
    searchTimeout = window.setTimeout(() => {
      searchProducts(newQuery);
    }, 300);
  });

  /**
   * Načte konkrétní produkt podle ID (pro předvyplnění)
   */
  const loadProductById = async (productId: string): Promise<Product | null> => {
    try {
      const product = await productsService.getById(productId);
      return product;
    } catch (err) {
      console.error('❌ Error loading product:', err);
      return null;
    }
  };

  /**
   * Vyčistí vyhledávání
   */
  const clearSearch = () => {
    searchQuery.value = '';
    products.value = [];
    error.value = null;
  };

  return {
    products,
    loading,
    searchQuery,
    error,
    searchProducts,
    loadProductById,
    clearSearch
  };
}