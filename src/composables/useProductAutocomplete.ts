// src/composables/useProductAutocomplete.ts
import { ref, watch } from 'vue';
import { productsService } from '@/services/productsService';
import type { Product } from '@/services/productsService';

/**
 * Composable pro autocomplete vyhledávání produktů
 * Umožňuje real-time vyhledávání přes API s debounce
 */
export function useProductAutocomplete() {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  
  let searchTimeout: number | null = null;

  /**
   * Vyhledá produkty podle query
   */
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      products.value = [];
      return;
    }

    loading.value = true;
    
    try {
      const response = await productsService.getAll(undefined, {
        maxSize: 50, // Stačí načíst méně položek pro autocomplete
        offset: 0,
        orderBy: 'name',
        order: 'asc',
        // Textový filtr přes API
        'whereGroup[0][type]': 'textFilter',
        'whereGroup[0][value]': query.trim()
      } as any);
      
      products.value = response.list;
    } catch (err) {
      console.error('❌ Chyba při vyhledávání produktů:', err);
      products.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Debounced search - čeká 300ms po posledním stisku
   */
  const debouncedSearch = (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = window.setTimeout(() => {
      searchProducts(query);
    }, 300);
  };

  /**
   * Watch na změnu searchQuery
   */
  watch(searchQuery, (newQuery) => {
    debouncedSearch(newQuery);
  });

  /**
   * Načte produkt podle ID (pro inicializaci)
   */
  const loadProductById = async (productId: string) => {
    try {
      const product = await productsService.getById(productId);
      // Přidej produkt do seznamu, pokud tam ještě není
      if (!products.value.find(p => p.id === productId)) {
        products.value.push(product);
      }
      return product;
    } catch (err) {
      console.error('❌ Chyba při načítání produktu:', err);
      return null;
    }
  };

  return {
    products,
    loading,
    searchQuery,
    searchProducts,
    debouncedSearch,
    loadProductById
  };
}