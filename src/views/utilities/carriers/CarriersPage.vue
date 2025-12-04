<!-- src/views/utilities/carriers/CarriersPage.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { carrierService } from '@/services/carrierService';
import type { Carrier, CreateCarrierData } from '@/services/carrierService';

const router = useRouter();

const page = ref({ title: 'Dopravci' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Dopravci', disabled: true, href: '#' }
]);

const carriers = ref<Carrier[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const search = ref('');
const showDialog = ref(false);
const editingCarrier = ref<Carrier | null>(null);
const saving = ref(false);
const totalCarriers = ref(0);

// Formulářová data
const formData = ref<CreateCarrierData>({
  name: '',
  queue: '',
  carrierType: 'CP',
  country: 'CZ',
  eshopName: ''
});

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Typ dopravce', key: 'carrierType', sortable: true },
  { title: 'Země', key: 'country', sortable: true },
  { title: 'Fronta', key: 'queue', sortable: true },
  { title: 'E-shop název', key: 'eshopName', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const carrierTypes = [
  { title: 'Česká pošta', value: 'CP' },
  { title: 'PPL', value: 'PPL' },
  { title: 'Zásilkovna', value: 'PACKETA' },
  { title: 'GLS', value: 'GLS' }
];

const countries = [
  { title: 'Česká republika', value: 'CZ' },
  { title: 'Slovensko', value: 'SK' },
  { title: 'Maďarsko', value: 'HU' },
  { title: 'Polsko', value: 'PL' }
];

const loadCarriers = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await carrierService.getAll({
      maxSize: 100,
      offset: 0,
      orderBy: 'createdAt',
      order: 'desc',
      textFilter: search.value
    });
    carriers.value = response.list;
    totalCarriers.value = response.total;
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání dopravců';
    console.error('Chyba při načítání dopravců:', err);
  } finally {
    loading.value = false;
  }
};

// Sledování změn vyhledávacího pole s debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadCarriers();
  }, 300);
});

const openCreateDialog = () => {
  editingCarrier.value = null;
  formData.value = {
    name: '',
    queue: '',
    carrierType: 'CP',
    country: 'CZ',
    eshopName: ''
  };
  showDialog.value = true;
};

const openEditDialog = (carrier: Carrier) => {
  editingCarrier.value = carrier;
  formData.value = {
    name: carrier.name,
    queue: carrier.queue,
    carrierType: carrier.carrierType,
    country: carrier.country,
    eshopName: carrier.eshopName
  };
  showDialog.value = true;
};

const saveCarrier = async () => {
  if (!formData.value.name) {
    error.value = 'Název dopravce je povinný';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    if (editingCarrier.value) {
      await carrierService.update(editingCarrier.value.id, formData.value);
    } else {
      await carrierService.create(formData.value);
    }

    showDialog.value = false;
    await loadCarriers();
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání dopravce';
    console.error('Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

const deleteCarrier = async (carrier: Carrier) => {
  if (!confirm(`Opravdu chcete smazat dopravce "${carrier.name}"?`)) {
    return;
  }

  try {
    await carrierService.delete(carrier.id);
    await loadCarriers();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání dopravce';
    console.error('Chyba při mazání:', err);
  }
};

const getCountryFlag = (countryCode: string): string => {
  const flags: Record<string, string> = {
    'CZ': '🇨🇿',
    'SK': '🇸🇰',
    'HU': '🇭🇺',
    'PL': '🇵🇱'
  };
  return flags[countryCode] || '🏳️';
};

const getCarrierIcon = (carrierType: string): string => {
  const icons: Record<string, string> = {
    'CP': 'mdi-email',
    'PPL': 'mdi-truck',
    'PACKETA': 'mdi-package-variant',
    'GLS': 'mdi-truck-delivery'
  };
  return icons[carrierType] || 'mdi-truck';
};

onMounted(() => {
  loadCarriers();
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
              <div class="text-subtitle-2 text-medium-emphasis">Celkem dopravců</div>
              <div class="text-h4 font-weight-bold mt-2">{{ totalCarriers }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Česká pošta</div>
              <div class="text-h4 font-weight-bold mt-2 text-primary">
                {{ carriers.filter(c => c.carrierType === 'CP').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Zásilkovna</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ carriers.filter(c => c.carrierType === 'PACKETA').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">PPL / GLS</div>
              <div class="text-h4 font-weight-bold mt-2 text-info">
                {{ carriers.filter(c => c.carrierType === 'PPL' || c.carrierType === 'GLS').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam dopravců">
        <!-- Akční panel -->
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Hledat dopravce"
            single-line
            hide-details
            variant="outlined"
            density="compact"
            class="search-field"
            style="max-width: 400px"
          ></v-text-field>

          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="loadCarriers"
              :loading="loading"
            >
              Obnovit
            </v-btn>
            <v-btn
              color="success"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Nový dopravce
            </v-btn>
          </div>
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
          <strong>Chyba:</strong> {{ error }}
        </v-alert>

        <!-- Tabulka -->
        <v-data-table
          :headers="headers"
          :items="carriers"
          :loading="loading"
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-icon class="mr-2" :color="item.carrierType === 'CP' ? 'primary' : item.carrierType === 'PACKETA' ? 'success' : 'info'">
                {{ getCarrierIcon(item.carrierType) }}
              </v-icon>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
              </div>
            </div>
          </template>

          <template v-slot:item.carrierType="{ item }">
            <v-chip
              :color="item.carrierType === 'CP' ? 'primary' : item.carrierType === 'PACKETA' ? 'success' : 'info'"
              size="small"
              variant="tonal"
            >
              {{ item.carrierType }}
            </v-chip>
          </template>

          <template v-slot:item.country="{ item }">
            <div class="d-flex align-center">
              <span class="mr-2">{{ getCountryFlag(item.country) }}</span>
              <span>{{ item.country }}</span>
            </div>
          </template>

          <template v-slot:item.queue="{ item }">
            <v-chip size="small" variant="outlined">
              {{ item.queue }}
            </v-chip>
          </template>

          <template v-slot:item.eshopName="{ item }">
            <span class="text-medium-emphasis">{{ item.eshopName }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openEditDialog(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              @click="deleteCarrier(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-truck-delivery</v-icon>
              <div class="text-h6 mt-4">Žádní dopravci</div>
              <div class="text-caption text-medium-emphasis">Vytvořte prvního dopravce</div>
            </div>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Dialog pro vytvoření/úpravu dopravce -->
  <v-dialog v-model="showDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ editingCarrier ? 'Upravit dopravce' : 'Nový dopravce' }}</span>
        <v-btn icon variant="text" @click="showDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-form>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Název dopravce *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-truck-delivery"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.carrierType"
                :items="carrierTypes"
                label="Typ dopravce *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-format-list-bulleted-type"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.country"
                :items="countries"
                label="Země *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-flag"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.queue"
                label="Fronta *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-playlist-check"
                hint="Např. GLS_CZ, PACKETA_SK, PPL_CZ"
                persistent-hint
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.eshopName"
                label="E-shop název *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-shopping"
                hint="Např. GLS_CZ_HD, PACKETA_SK_PP"
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="showDialog = false"
        >
          Zrušit
        </v-btn>
        <v-btn
          color="primary"
          @click="saveCarrier"
          :loading="saving"
        >
          {{ editingCarrier ? 'Uložit' : 'Vytvořit' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
