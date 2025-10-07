<!-- src/views/utilities/products/ProductsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productsService } from '@/services/productsService';
import type { Product } from '@/types/product';

const page = ref({ title: 'Sklad expedice' });
const breadcrumbs = ref([
  { title: 'Produkty', disabled: false, href: '#' },
  { title: 'Sklad expedice', disabled: true, href: '#' }
]);

const search = ref('');
const itemsPerPage = ref(10);
const currentPage = ref(1);
const products = ref<Product[]>([]);
const loading = ref(false);

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'SKU', key: 'sku', sortable: true },
  { title: 'Měsíční spotřeba', key: 'monthlyConsumption', sortable: true },
  { title: 'Min. sklad', key: 'minStock', sortable: true },
  { title: 'Celkové množství', key: 'totalQuantity', sortable: true },
  { title: 'Nákladová cena', key: 'costPrice', sortable: true },
  { title: 'Celková cena zásob', key: 'totalStockPrice', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const filteredProducts = computed(() => {
  return products.value;
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
});

const totalItems = computed(() => filteredProducts.value.length);

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const loadProducts = async () => {
  loading.value = true;
  try {
    products.value = await productsService.getAll({ search: search.value });
  } catch (error) {
    console.error('Chyba při načítání produktů:', error);
  } finally {
    loading.value = false;
  }
};

const deleteProduct = async (id: number) => {
  if (confirm('Opravdu chcete smazat tento produkt?')) {
    try {
      await productsService.delete(id);
      await loadProducts();
    } catch (error) {
      console.error('Chyba při mazání produktu:', error);
    }
  }
};

const isLowStock = (product: Product) => {
  return product.totalQuantity < product.minStock;
};

onMounted(() => {
  loadProducts();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Sklad expedice">
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
            @update:model-value="loadProducts"
            prepend-inner-icon="mdi-magnify"
            label="Hledat"
            single-line
            hide-details
            variant="outlined"
            density="compact"
            class="search-field"
            style="max-width: 400px"
          ></v-text-field>
          
          <div class="d-flex gap-2 flex-wrap">
            <v-btn color="primary" prepend-icon="mdi-plus">
              Vytvořit produkt
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-download">
              Export
            </v-btn>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="paginatedProducts"
          :loading="loading"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <a href="#" class="text-primary text-decoration-none">{{ item.name }}</a>
              <v-chip
                v-if="isLowStock(item)"
                size="x-small"
                color="error"
                variant="flat"
                class="ml-2"
              >
                Nízký stav
              </v-chip>
            </div>
          </template>

          <template v-slot:item.sku="{ item }">
            <span class="text-medium-emphasis">{{ item.sku || '—' }}</span>
          </template>
          
          <template v-slot:item.monthlyConsumption="{ item }">
            <span>{{ item.monthlyConsumption.toFixed(2) }}</span>
          </template>

          <template v-slot:item.minStock="{ item }">
            <span>{{ item.minStock }} ks</span>
          </template>

          <template v-slot:item.totalQuantity="{ item }">
            <span :class="isLowStock(item) ? 'text-error font-weight-bold' : ''">
              {{ item.totalQuantity }} ks
            </span>
          </template>

          <template v-slot:item.costPrice="{ item }">
            <span>{{ formatPrice(item.costPrice) }}</span>
          </template>

          <template v-slot:item.totalStockPrice="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.totalStockPrice) }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon size="small" variant="text" color="primary">
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

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Položek na stránku:</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[10, 25, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 100px"
                ></v-select>
              </div>
              
              <div class="text-body-2">
                {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, totalItems) }} z {{ totalItems }}
              </div>

              <v-pagination
                v-model="currentPage"
                :length="totalPages"
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
.search-field {
  min-width: 250px;
}

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