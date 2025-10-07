<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Sklad expedice' });
const breadcrumbs = ref([
  {
    title: 'Produkty',
    disabled: false,
    href: '#'
  },
  {
    title: 'Sklad expedice',
    disabled: true,
    href: '#'
  }
]);

// Search and pagination
const search = ref('');
const itemsPerPage = ref(10);
const currentPage = ref(1);

// Table headers
const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Měsíční spotřeba', key: 'monthlyConsumption', sortable: true },
  { title: 'Minimální sklad', key: 'minStock', sortable: true },
  { title: 'Celkové množství', key: 'totalQuantity', sortable: true },
  { title: 'Nákladová cena', key: 'costPrice', sortable: true },
  { title: 'Celková cena zásob', key: 'totalStockPrice', sortable: true }
]);

// Sample data based on the screenshot
const products = ref([
  { id: 1, name: '3x Maca 60 cps', monthlyConsumption: 195.33, minStock: '300 ks', totalQuantity: '572 ks', costPrice: '80,90 Kč', totalStockPrice: '46 274,80 Kč' },
  { id: 2, name: 'ACAI 70g', monthlyConsumption: 45, minStock: '20 ks', totalQuantity: '123 ks', costPrice: '105,69 Kč', totalStockPrice: '13 000,21 Kč' },
  { id: 3, name: 'Acerola 60 kapslí', monthlyConsumption: 188.17, minStock: '300 ks', totalQuantity: '381 ks', costPrice: '62,00 Kč', totalStockPrice: '23 622,00 Kč' },
  { id: 4, name: 'Acerola Dárek 4 cps', monthlyConsumption: 0, minStock: '0 ks', totalQuantity: '0 ks', costPrice: '4,85 Kč', totalStockPrice: '0,00 Kč' },
  { id: 5, name: 'ALFA ALFA 60g', monthlyConsumption: 36.17, minStock: '20 ks', totalQuantity: '156 ks', costPrice: '20,94 Kč', totalStockPrice: '3 267,08 Kč' },
  { id: 6, name: 'Arašídové máslo v prášku 200g', monthlyConsumption: 64.33, minStock: '30 ks', totalQuantity: '66 ks', costPrice: '151,30 Kč', totalStockPrice: '9 985,80 Kč' },
  { id: 7, name: 'ASHWAGANDHA 100g', monthlyConsumption: 139, minStock: '40 ks', totalQuantity: '93 ks', costPrice: '34,65 Kč', totalStockPrice: '3 222,45 Kč' },
  { id: 8, name: 'Ashwagandha 60cps', monthlyConsumption: 139.17, minStock: '200 ks', totalQuantity: '545 ks', costPrice: '91,10 Kč', totalStockPrice: '49 649,50 Kč' },
  { id: 9, name: 'BCAA a Kreatin Malina 300g', monthlyConsumption: 89.83, minStock: '40 ks', totalQuantity: '248 ks', costPrice: '161,34 Kč', totalStockPrice: '40 012,01 Kč' },
  { id: 10, name: 'BCAA a Kreatin Maracuja a Banán 300g', monthlyConsumption: 58, minStock: '40 ks', totalQuantity: '235 ks', costPrice: '174,30 Kč', totalStockPrice: '40 961,44 Kč' },
  { id: 11, name: 'Bezlaktózový protein 350g', monthlyConsumption: 330.33, minStock: '40 ks', totalQuantity: '101 ks', costPrice: '113,33 Kč', totalStockPrice: '11 446,00 Kč' },
  { id: 12, name: 'Bezlaktózový protein Banán 350g', monthlyConsumption: 96, minStock: '40 ks', totalQuantity: '24 ks', costPrice: '117,43 Kč', totalStockPrice: '2 818,29 Kč' },
  { id: 13, name: 'Bezlaktózový protein Jahoda 350g', monthlyConsumption: 136.17, minStock: '40 ks', totalQuantity: '67 ks', costPrice: '130,04 Kč', totalStockPrice: '8 712,68 Kč' },
  { id: 14, name: 'Bezlaktózový protein Kakao 350g', monthlyConsumption: 131.83, minStock: '40 ks', totalQuantity: '69 ks', costPrice: '108,87 Kč', totalStockPrice: '7 512,06 Kč' },
  { id: 15, name: 'Bezlaktózový protein Kokos 350g', monthlyConsumption: 52.17, minStock: '40 ks', totalQuantity: '84 ks', costPrice: '101,80 Kč', totalStockPrice: '8 551,07 Kč' }
]);

// Filtered and sorted products
const filteredProducts = computed(() => {
  let filtered = products.value;
  
  if (search.value) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(search.value.toLowerCase())
    );
  }
  
  return filtered;
});

// Paginated products
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
});

const totalItems = computed(() => filteredProducts.value.length);

// Action handlers
const createProduct = () => {
  console.log('Vytvořit produkt');
};

const editEntity = () => {
  console.log('Upravit entitu');
};

const editLayout = () => {
  console.log('Upravit layout');
};

const editFilters = () => {
  console.log('Upravit filtry');
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Sklad expedice">
        <!-- Action Buttons -->
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
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
            <v-btn color="primary" prepend-icon="mdi-plus" @click="createProduct">
              Vytvořit produkt
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-pencil" @click="editEntity">
              Upravit entitu
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-page-layout-body" @click="editLayout">
              Upravit layout
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-filter" @click="editFilters">
              Upravit filtry
            </v-btn>
          </div>
        </div>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="paginatedProducts"
          :items-per-page="itemsPerPage"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <a href="#" class="text-primary text-decoration-none">{{ item.name }}</a>
          </template>
          
          <template v-slot:item.monthlyConsumption="{ item }">
            <span>{{ item.monthlyConsumption.toFixed(2) }}</span>
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