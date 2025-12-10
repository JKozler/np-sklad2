<!-- src/views/utilities/packages/PackagesPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { packagesService } from '@/services/packagesService';
import type { Package, PackageStatus } from '@/services/packagesService';

const page = ref({ title: 'Balíky' });
const breadcrumbs = ref([
  { title: 'Výroba', disabled: false, href: '#' },
  { title: 'Balíky', disabled: true, href: '#' }
]);

const packages = ref<Package[]>([]);
const loading = ref(false);
const searchText = ref('');

// Paginace - serverová
const currentOffset = ref(0);
const itemsPerPage = ref(20);
const totalFromAPI = ref(0);

const headers = ref([
  { title: 'Číslo balíku', key: 'name', sortable: true },
  { title: 'Objednávka', key: 'salesOrderName', sortable: true },
  { title: 'Zákazník', key: 'customer', sortable: true },
  { title: 'Dopravce', key: 'carrierName', sortable: true },
  { title: 'Tracking status', key: 'lastTrackingStatusNormalized', sortable: true },
  { title: 'Datum', key: 'createdAt', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const packageStatusLabels: Record<PackageStatus, string> = {
  'TO_PACK': 'K zabalení',
  'PACKED': 'Zabaleno',
  'TO_RETURN': 'K vrácení',
  'RETURNED': 'Vráceno',
  'ERROR': 'Chyba'
};

const packageStatusColors: Record<PackageStatus, string> = {
  'TO_PACK': 'primary',
  'PACKED': 'success',
  'TO_RETURN': 'warning',
  'RETURNED': 'info',
  'ERROR': 'error'
};

// Paginace: Computed properties
const totalPages = computed(() => {
  return Math.ceil(totalFromAPI.value / itemsPerPage.value);
});

const currentPage = computed(() => {
  return Math.floor(currentOffset.value / itemsPerPage.value) + 1;
});

const displayRange = computed(() => {
  const from = currentOffset.value + 1;
  const to = Math.min(currentOffset.value + packages.value.length, totalFromAPI.value);
  return { from, to };
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getCustomerName = (pkg: Package) => {
  return `${pkg.shippingAddressFirstName} ${pkg.shippingAddressLastName}`;
};

const getCarrierColor = (carrierName: string) => {
  const name = carrierName.toLowerCase();

  // Zásilkovna - červená s bílým textem
  if (name.includes('zásilkovna') || name.includes('zasilkovna')) {
    return { color: 'red-darken-1', variant: 'flat' as const };
  }

  // PPL - modrá s bílým textem
  if (name.includes('ppl')) {
    return { color: 'blue-darken-1', variant: 'flat' as const };
  }

  if (name.includes('gls')) {
    return { color: 'gls-darken-1', variant: 'flat' as const };
  }

  // Balíkovna - světlejší modrá než PPL
  if (name.includes('balíkovna') || name.includes('balikovna')) {
    return { color: 'light-blue-darken-1', variant: 'flat' as const };
  }

  // Ostatní dopravci - výchozí styl
  return { color: undefined, variant: 'outlined' as const };
};

const getTrackingStatusColor = (status: string) => {
  if (status === 'CREATED') return 'default';
  if (status === 'DELIVERED') return 'success';
  if (status === 'IN_TRANSIT') return 'info';
  if (status === 'ERROR') return 'error';
  return 'primary';
};

const loadPackages = async () => {
  loading.value = true;
  try {
    const response = await packagesService.getAll(
      searchText.value || undefined,
      itemsPerPage.value,
      currentOffset.value
    );
    packages.value = response.list;
    totalFromAPI.value = response.total;

    console.log('✅ Načteno balíků:', packages.value.length, '/', response.total);
  } catch (error) {
    console.error('Chyba při načítání balíků:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentOffset.value = 0;
  loadPackages();
};

const goToPage = (page: number) => {
  currentOffset.value = (page - 1) * itemsPerPage.value;
  loadPackages();
};

const nextPage = () => {
  if (currentOffset.value + itemsPerPage.value < totalFromAPI.value) {
    currentOffset.value += itemsPerPage.value;
    loadPackages();
  }
};

const prevPage = () => {
  if (currentOffset.value > 0) {
    currentOffset.value = Math.max(0, currentOffset.value - itemsPerPage.value);
    loadPackages();
  }
};

onMounted(() => {
  loadPackages();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam balíků">
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="searchText"
            @keyup.enter="handleSearch"
            label="Vyhledat balík..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 400px"
            clearable
            @click:clear="handleSearch"
          >
            <template v-slot:append>
              <v-btn
                @click="handleSearch"
                color="primary"
                size="small"
                :loading="loading"
              >
                Hledat
              </v-btn>
            </template>
          </v-text-field>

          <div class="d-flex gap-2">
            <v-btn
              @click="loadPackages"
              variant="outlined"
              prepend-icon="mdi-refresh"
              :loading="loading"
            >
              Obnovit
            </v-btn>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="packages"
          :loading="loading"
          :items-per-page="itemsPerPage"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <router-link
              :to="`/packages/${item.id}`"
              class="text-primary text-decoration-none font-weight-medium"
            >
              {{ item.name }}
            </router-link>
          </template>

          <template v-slot:item.salesOrderName="{ item }">
            <router-link
              :to="`/orders/${item.salesOrderId}`"
              class="text-decoration-none"
            >
              {{ item.salesOrderName }}
            </router-link>
          </template>

          <template v-slot:item.customer="{ item }">
            <div class="font-weight-medium">{{ getCustomerName(item) }}</div>
          </template>

          <template v-slot:item.carrierName="{ item }">
            <v-chip
              v-if="item.carrierName"
              size="small"
              :color="getCarrierColor(item.carrierName).color"
              :variant="getCarrierColor(item.carrierName).variant"
            >
              {{ item.carrierName }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.lastTrackingStatusNormalized="{ item }">
            <v-chip
              size="small"
              :color="getTrackingStatusColor(item.lastTrackingStatusNormalized)"
              variant="tonal"
            >
              {{ item.lastTrackingStatusNormalized }}
            </v-chip>
          </template>

          <template v-slot:item.createdAt="{ item }">
            <div class="text-body-2">{{ formatDate(item.createdAt) }}</div>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  v-bind="props"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item :to="`/packages/${item.id}`">
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-eye</v-icon>
                    Detail
                  </v-list-item-title>
                </v-list-item>
                <v-list-item :to="`/orders/${item.salesOrderId}`">
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-shopping</v-icon>
                    Zobrazit objednávku
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap" v-if="totalFromAPI > 0">
              <div class="text-body-2">
                Zobrazeno {{ displayRange.from }}-{{ displayRange.to }} z {{ totalFromAPI }} balíků
              </div>

              <v-pagination
                v-if="totalPages > 1"
                :model-value="currentPage"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
                @update:model-value="goToPage"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-6">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant</v-icon>
              <div class="text-h6 mt-4 text-medium-emphasis">
                {{ searchText ? 'Žádné balíky nenalezeny' : 'Zatím nemáte žádné balíky' }}
              </div>
              <div class="text-body-2 text-medium-emphasis mt-2">
                {{ searchText ? 'Zkuste jiné vyhledávací kritérium' : 'Balíky se zobrazí automaticky po vytvoření' }}
              </div>
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
