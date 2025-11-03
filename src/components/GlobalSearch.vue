<!-- src/components/GlobalSearch.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { globalSearchService } from '@/services/globalSearchService';
import type { GlobalSearchResult } from '@/services/globalSearchService';

const router = useRouter();

const searchQuery = ref('');
const searchResults = ref<GlobalSearchResult[]>([]);
const loading = ref(false);
const showResults = ref(false);
const error = ref<string | null>(null);

let searchTimeout: number | null = null;

// Entity type ikony a barvy
const entityIcons: Record<string, string> = {
  Product: 'mdi-package-variant',
  InventoryTransaction: 'mdi-swap-horizontal',
  Warehouse: 'mdi-warehouse',
  Contact: 'mdi-account',
  Account: 'mdi-domain',
  Lead: 'mdi-account-plus',
  Opportunity: 'mdi-cash',
  default: 'mdi-file-document'
};

const entityColors: Record<string, string> = {
  Product: 'primary',
  InventoryTransaction: 'info',
  Warehouse: 'success',
  Contact: 'secondary',
  Account: 'warning',
  Lead: 'purple',
  Opportunity: 'green',
  default: 'grey'
};

const entityLabels: Record<string, string> = {
  Product: 'Produkt',
  InventoryTransaction: 'Skladový pohyb',
  Warehouse: 'Sklad',
  Contact: 'Kontakt',
  Account: 'Účet',
  Lead: 'Lead',
  Opportunity: 'Příležitost',
  default: 'Záznam'
};

const getEntityIcon = (entityType: string): string => {
  return entityIcons[entityType] || entityIcons.default;
};

const getEntityColor = (entityType: string): string => {
  return entityColors[entityType] || entityColors.default;
};

const getEntityLabel = (entityType: string): string => {
  return entityLabels[entityType] || entityType;
};

// Routy pro různé entity
const getEntityRoute = (result: GlobalSearchResult): string => {
  switch (result.entityType) {
    case 'Product':
      return `/products/${result.id}`;
    case 'InventoryTransaction':
      return `/inventory-transactions/${result.id}`;
    case 'Warehouse':
      return `/warehouses`;
    default:
      return '#';
  }
};

/**
 * Provede globální vyhledávání
 */
const performSearch = async () => {
  const query = searchQuery.value.trim();
  
  if (!query || query.length < 2) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await globalSearchService.search({
      q: query,
      maxSize: 10
    });
    
    searchResults.value = response.list;
    showResults.value = true;
    console.log('✅ Global search results:', response.list.length);
  } catch (err: any) {
    error.value = err.message || 'Chyba při vyhledávání';
    console.error('❌ Global search error:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Debounced search
 */
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  searchTimeout = window.setTimeout(() => {
    performSearch();
  }, 300);
};

/**
 * Watch na změnu query
 */
watch(searchQuery, () => {
  if (searchQuery.value.trim().length >= 2) {
    debouncedSearch();
  } else {
    searchResults.value = [];
    showResults.value = false;
  }
});

/**
 * Navigace na výsledek
 */
const navigateToResult = (result: GlobalSearchResult) => {
  const route = getEntityRoute(result);
  if (route !== '#') {
    router.push(route);
    clearSearch();
  }
};

/**
 * Vyčistí vyhledávání
 */
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showResults.value = false;
};

/**
 * Obsluha focus/blur pro zobrazení výsledků
 */
const handleFocus = () => {
  if (searchResults.value.length > 0) {
    showResults.value = true;
  }
};

const handleBlur = () => {
  // Timeout kvůli kliku na výsledek
  setTimeout(() => {
    showResults.value = false;
  }, 200);
};
</script>

<template>
  <div class="global-search-wrapper">
    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="Globální vyhledávání..."
      variant="outlined"
      density="compact"
      hide-details
      clearable
      @focus="handleFocus"
      @blur="handleBlur"
      @click:clear="clearSearch"
      class="global-search-input"
    >
      <template v-slot:append-inner>
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="20"
          width="2"
          color="primary"
        ></v-progress-circular>
      </template>
    </v-text-field>

    <!-- Výsledky vyhledávání -->
    <v-card
      v-if="showResults"
      class="search-results-card elevation-8"
      max-height="400"
    >
      <!-- Loading state -->
      <div v-if="loading" class="pa-4 text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="text-caption mt-2">Vyhledávám...</div>
      </div>

      <!-- Error state -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="ma-2"
      >
        {{ error }}
      </v-alert>

      <!-- No results -->
      <div v-else-if="searchResults.length === 0 && searchQuery.length >= 2" class="pa-4 text-center">
        <v-icon size="48" color="grey-lighten-1">mdi-magnify</v-icon>
        <div class="text-subtitle-2 mt-2">Žádné výsledky</div>
        <div class="text-caption text-medium-emphasis">
          Pro výraz "{{ searchQuery }}" nebyly nalezeny žádné záznamy
        </div>
      </div>

      <!-- Results list -->
      <v-list v-else density="compact">
        <v-list-subheader v-if="searchResults.length > 0">
          Nalezeno {{ searchResults.length }} výsledků
        </v-list-subheader>

        <v-list-item
          v-for="result in searchResults"
          :key="`${result.entityType}-${result.id}`"
          @click="navigateToResult(result)"
          class="search-result-item"
        >
          <template v-slot:prepend>
            <v-avatar :color="getEntityColor(result.entityType)" size="40" variant="tonal">
              <v-icon :icon="getEntityIcon(result.entityType)"></v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ result.name }}
          </v-list-item-title>

          <v-list-item-subtitle>
            <v-chip 
              :color="getEntityColor(result.entityType)" 
              size="x-small" 
              variant="tonal"
              class="mr-2"
            >
              {{ getEntityLabel(result.entityType) }}
            </v-chip>
            <span v-if="result.code" class="text-caption">
              Kód: {{ result.code }}
            </span>
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-icon size="small">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>

      <!-- Footer s tipem -->
      <v-divider></v-divider>
      <div class="pa-2 text-center text-caption text-medium-emphasis">
        <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
        Vyhledávání minimálně 2 znaky
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.global-search-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.global-search-input {
  width: 100%;
}

.search-results-card {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 1000;
  overflow-y: auto;
}

.search-result-item {
  cursor: pointer;
}

.search-result-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Mobile optimalizace */
@media (max-width: 600px) {
  .global-search-wrapper {
    max-width: 100%;
  }
}
</style>