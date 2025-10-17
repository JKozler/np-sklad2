<!-- src/views/utilities/products/ProductsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productsService } from '@/services/productsService';
import type { Product, ProductFilters } from '@/services/productsService';


const router = useRouter();

const page = ref({ title: 'Produkty z API' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Produkty', disabled: true, href: '#' }
]);

// Data
const products = ref<Product[]>([]);
const allProducts = ref<Product[]>([]);
const totalProducts = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);
const productGroups = ref<Array<{ id: string; name: string }>>([]);

// Filtry
const filters = ref<ProductFilters>({
  search: '',
  stockType: '',
  isStockItem: undefined,
  productGroup: '',
  priceFrom: undefined,
  priceTo: undefined
});

// Stránkování a řazení
const page_number = ref(0);
const itemsPerPage = ref(20);
const sortBy = ref('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Debounce pro hledání
let searchTimeout: number | null = null;

watch(() => filters.value.search, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page_number.value = 0;
    applyFilters();
  }, 500) as unknown as number;
});

const headers = ref([
  { title: 'Abra ID', key: 'abraId', sortable: true },
  { title: 'Kód', key: 'code', sortable: true },
  { title: 'Název', key: 'name', sortable: true },
  { title: 'EAN', key: 'ean', sortable: false },
  { title: 'Typ zásob', key: 'stockType', sortable: true },
  { title: 'Skladová', key: 'isStockItem', sortable: true },
  { title: 'Cena bez DPH', key: 'priceWithoutVat', sortable: true },
  { title: 'Cena s DPH', key: 'priceWithVat', sortable: true },
  { title: 'Skupina', key: 'productGroupName', sortable: false },
  { title: 'MJ', key: 'uomName', sortable: false },
  { title: 'Akce', key: 'actions', sortable: false }
]);

// Filtrované produkty
const filteredProducts = computed(() => {
  let filtered = [...allProducts.value];
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.code.toLowerCase().includes(search)
    );
  }
  
  if (filters.value.stockType) {
    filtered = filtered.filter(p => p.stockType === filters.value.stockType);
  }
  
  if (filters.value.isStockItem !== undefined) {
    filtered = filtered.filter(p => p.isStockItem === filters.value.isStockItem);
  }
  
  if (filters.value.productGroup) {
    filtered = filtered.filter(p => p.productGroupId === filters.value.productGroup);
  }
  
  if (filters.value.priceFrom !== undefined) {
    filtered = filtered.filter(p => p.priceWithoutVat >= filters.value.priceFrom!);
  }
  
  if (filters.value.priceTo !== undefined) {
    filtered = filtered.filter(p => p.priceWithoutVat <= filters.value.priceTo!);
  }
  
  return filtered;
});

// Stránkované produkty
const paginatedProducts = computed(() => {
  const start = page_number.value * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price || 0);
};

const getStockTypeLabel = (type: string) => {
  if (type === 'typZasoby.zbozi') return 'Zboží';
  if (type === 'typZasoby.material') return 'Materiál';
  return type;
};

const getStockTypeColor = (type: string) => {
  if (type === 'typZasoby.zbozi') return 'primary';
  if (type === 'typZasoby.material') return 'secondary';
  return 'default';
};

const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Načteme VŠECHNY produkty pro filtrování na frontendu
    const response = await productsService.getAll(undefined, {
      maxSize: 200,
      offset: 0,
      orderBy: sortBy.value,
      order: sortOrder.value
    });

    allProducts.value = response.list;
    totalProducts.value = response.total;
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání produktů';
    console.error('Chyba při načítání produktů:', err);
  } finally {
    loading.value = false;
  }
};

const loadProductGroups = async () => {
  try {
    productGroups.value = await productsService.getProductGroups();
  } catch (err) {
    console.error('Chyba při načítání skupin produktů:', err);
  }
};

const deleteProduct = async (id: string) => {
  if (confirm('Opravdu chcete smazat tento produkt?')) {
    try {
      await productsService.delete(id);
      await loadProducts();
    } catch (err) {
      console.error('Chyba při mazání produktu:', err);
      alert('Chyba při mazání produktu');
    }
  }
};

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortOrder.value = 'asc';
  }
  loadProducts();
};

const resetFilters = () => {
  filters.value = {
    search: '',
    stockType: '',
    isStockItem: undefined,
    productGroup: '',
    priceFrom: undefined,
    priceTo: undefined
  };
  page_number.value = 0;
};

const applyFilters = () => {
  page_number.value = 0;
};

const changePage = (newPage: number) => {
  page_number.value = newPage;
};

const changeItemsPerPage = (newSize: number) => {
  itemsPerPage.value = newSize;
  page_number.value = 0;
};

onMounted(() => {
  loadProducts();
  loadProductGroups();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <!-- Statistiky -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Celkem produktů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ totalProducts }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Po filtrování</div>
              <div class="text-h4 font-weight-bold mt-2">{{ filteredProducts.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Zobrazeno</div>
              <div class="text-h4 font-weight-bold mt-2">{{ paginatedProducts.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Stránka</div>
              <div class="text-h4 font-weight-bold mt-2">{{ page_number + 1 }} / {{ totalPages }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam produktů z API">
        <!-- Filtry -->
        <v-expansion-panels class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-filter</v-icon>
              Filtry produktů
              <v-chip 
                v-if="Object.values(filters).filter(v => v !== '' && v !== undefined).length > 0"
                color="primary" 
                size="small" 
                class="ml-2"
              >
                {{ Object.values(filters).filter(v => v !== '' && v !== undefined).length }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="filters.search"
                    label="Hledat v názvu nebo kódu"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    clearable
                    hint="Vyhledávání probíhá automaticky"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.stockType"
                    :items="[
                      { title: 'Všechny typy', value: '' },
                      { title: 'Zboží', value: 'typZasoby.zbozi' },
                      { title: 'Materiál', value: 'typZasoby.material' }
                    ]"
                    label="Typ zásob"
                    variant="outlined"
                    density="compact"
                    @update:model-value="applyFilters"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.isStockItem"
                    :items="[
                      { title: 'Vše', value: undefined },
                      { title: 'Ano', value: true },
                      { title: 'Ne', value: false }
                    ]"
                    label="Skladová položka"
                    variant="outlined"
                    density="compact"
                    @update:model-value="applyFilters"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.productGroup"
                    :items="[
                      { title: 'Všechny skupiny', value: '' }, 
                      ...productGroups.map(g => ({ title: g.name, value: g.id }))
                    ]"
                    label="Skupina produktů"
                    variant="outlined"
                    density="compact"
                    @update:model-value="applyFilters"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="filters.priceFrom"
                    label="Cena od (bez DPH)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    @update:model-value="applyFilters"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="filters.priceTo"
                    label="Cena do (bez DPH)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    @update:model-value="applyFilters"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex justify-end gap-2">
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    prepend-icon="mdi-refresh"
                    @click="resetFilters"
                  >
                    Resetovat filtry
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Akční tlačítka -->
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <div class="d-flex gap-2 flex-wrap">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              @click="loadProducts"
            >
              Obnovit
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
            >
              Export
            </v-btn>
          </div>
          
          <v-btn
            color="success"
            prepend-icon="mdi-plus"
            @click="router.push('/products/new')"
          >
            Nový produkt
          </v-btn>
        </div>

        <!-- Chybová hláška -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          <strong>Chyba při načítání:</strong> {{ error }}
        </v-alert>

        <!-- Tabulka -->
        <v-data-table
          :headers="headers"
          :items="paginatedProducts"
          :loading="loading"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <template v-slot:item.abraId="{ item }">
            <span class="font-weight-medium">{{ item.abraId }}</span>
          </template>

          <template v-slot:item.code="{ item }">
            <v-chip color="primary" size="small" variant="tonal">
              {{ item.code }}
            </v-chip>
          </template>

          <template v-slot:item.name="{ item }">
            <router-link 
              :to="`/products/${item.id}`" 
              class="text-primary font-weight-medium text-decoration-none"
            >
              {{ item.name }}
            </router-link>
          </template>

          <template v-slot:item.ean="{ item }">
            <span class="text-medium-emphasis">{{ item.ean || '—' }}</span>
          </template>

          <template v-slot:item.stockType="{ item }">
            <v-chip 
              :color="getStockTypeColor(item.stockType)" 
              size="small"
              variant="tonal"
            >
              {{ getStockTypeLabel(item.stockType) }}
            </v-chip>
          </template>

          <template v-slot:item.isStockItem="{ item }">
            <v-chip 
              :color="item.isStockItem ? 'success' : 'default'" 
              size="small"
              variant="tonal"
            >
              {{ item.isStockItem ? 'Ano' : 'Ne' }}
            </v-chip>
          </template>

          <template v-slot:item.priceWithoutVat="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.priceWithoutVat) }}</span>
          </template>

          <template v-slot:item.priceWithVat="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.priceWithVat) }}</span>
          </template>

          <template v-slot:item.productGroupName="{ item }">
            <span class="text-medium-emphasis">{{ item.productGroupName || '—' }}</span>
          </template>

          <template v-slot:item.uomName="{ item }">
            <span class="text-medium-emphasis">{{ item.uomName || '—' }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              :to="`/products/${item.id}`"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              @click="deleteProduct(item.id)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant</v-icon>
              <div class="text-h6 mt-4">Žádné produkty nenalezeny</div>
              <div class="text-caption text-medium-emphasis">Zkuste změnit filtry nebo obnovit data</div>
            </div>
          </template>

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Položek na stránku:</span>
                <v-select
                  :model-value="itemsPerPage"
                  :items="[10, 20, 50, 100]"
                  @update:model-value="changeItemsPerPage"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 100px"
                ></v-select>
              </div>
              
              <div class="text-body-2">
                {{ page_number * itemsPerPage + 1 }}-{{ Math.min((page_number + 1) * itemsPerPage, filteredProducts.length) }} 
                z {{ filteredProducts.length }}
              </div>

              <v-pagination
                :model-value="page_number + 1"
                :length="totalPages"
                @update:model-value="(val) => changePage(val - 1)"
                :total-visible="7"
                density="comfortable"
              ></v-pagination>
            </div>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.v-data-table th) {
  font-weight: 600;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.02);
}
</style>