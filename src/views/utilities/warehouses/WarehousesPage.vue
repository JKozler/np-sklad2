<!-- src/views/utilities/warehouses/WarehousesPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { warehouseService } from '@/services/warehouseService';
import type { Warehouse, CreateWarehouseData } from '@/services/warehouseService';

const router = useRouter();

const page = ref({ title: 'Sklady' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Sklady', disabled: true, href: '#' }
]);

const warehouses = ref<Warehouse[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const search = ref('');
const showDialog = ref(false);
const editingWarehouse = ref<Warehouse | null>(null);
const saving = ref(false);

// Formulářová data
const formData = ref<CreateWarehouseData>({
  name: '',
  code: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'CZ',
  description: '',
  isActive: true
});

const headers = ref([
  { title: 'Abra ID', key: 'abraId', sortable: true },
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Kód', key: 'code', sortable: true },
  { title: 'Město', key: 'city', sortable: true },
  { title: 'Stav', key: 'isActive', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const filteredWarehouses = computed(() => {
  if (!search.value) return warehouses.value;
  
  const searchLower = search.value.toLowerCase();
  return warehouses.value.filter(w => 
    w.name.toLowerCase().includes(searchLower) ||
    w.code?.toLowerCase().includes(searchLower) ||
    w.city?.toLowerCase().includes(searchLower)
  );
});

const loadWarehouses = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await warehouseService.getAll();
    warehouses.value = response.list;
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání skladů';
    console.error('Chyba při načítání skladů:', err);
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingWarehouse.value = null;
  formData.value = {
    name: '',
    code: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'CZ',
    description: '',
    isActive: true
  };
  showDialog.value = true;
};

const openEditDialog = (warehouse: Warehouse) => {
  editingWarehouse.value = warehouse;
  formData.value = {
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    city: warehouse.city,
    postalCode: warehouse.postalCode,
    country: warehouse.country,
    description: warehouse.description,
    isActive: warehouse.isActive
  };
  showDialog.value = true;
};

const saveWarehouse = async () => {
  if (!formData.value.name) {
    error.value = 'Název skladu je povinný';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    if (editingWarehouse.value) {
      await warehouseService.update(editingWarehouse.value.id, formData.value);
    } else {
      await warehouseService.create(formData.value);
    }
    
    showDialog.value = false;
    await loadWarehouses();
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání skladu';
    console.error('Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

const deleteWarehouse = async (warehouse: Warehouse) => {
  if (!confirm(`Opravdu chcete smazat sklad "${warehouse.name}"?`)) {
    return;
  }

  try {
    await warehouseService.delete(warehouse.id);
    await loadWarehouses();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání skladu';
    console.error('Chyba při mazání:', err);
  }
};

onMounted(() => {
  loadWarehouses();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <!-- Statistiky -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Celkem skladů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ warehouses.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Aktivní sklady</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ warehouses.filter(w => w.isActive).length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Neaktivní sklady</div>
              <div class="text-h4 font-weight-bold mt-2 text-error">
                {{ warehouses.filter(w => !w.isActive).length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam skladů">
        <!-- Akční panel -->
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Hledat sklad"
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
              @click="loadWarehouses"
              :loading="loading"
            >
              Obnovit
            </v-btn>
            <v-btn
              color="success"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Nový sklad
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
          :items="filteredWarehouses"
          :loading="loading"
          class="elevation-1"
        >
          <template v-slot:item.abraId="{ item }">
            <span class="font-weight-medium">{{ item.abraId }}</span>
          </template>

          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-warehouse</v-icon>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis" v-if="item.address">
                  {{ item.address }}
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.code="{ item }">
            <v-chip v-if="item.code" color="primary" size="small" variant="tonal">
              {{ item.code }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.city="{ item }">
            <span class="text-medium-emphasis">{{ item.city || '—' }}</span>
          </template>

          <template v-slot:item.isActive="{ item }">
            <v-chip 
              :color="item.isActive ? 'success' : 'error'" 
              size="small"
              variant="tonal"
            >
              {{ item.isActive ? 'Aktivní' : 'Neaktivní' }}
            </v-chip>
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
              @click="deleteWarehouse(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-warehouse</v-icon>
              <div class="text-h6 mt-4">Žádné sklady</div>
              <div class="text-caption text-medium-emphasis">Vytvořte první sklad</div>
            </div>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Dialog pro vytvoření/úpravu skladu -->
  <v-dialog v-model="showDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ editingWarehouse ? 'Upravit sklad' : 'Nový sklad' }}</span>
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
                label="Název skladu *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-warehouse"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.code"
                label="Kód skladu"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-barcode"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.country"
                :items="[
                  { title: 'Česká republika', value: 'CZ' },
                  { title: 'Slovensko', value: 'SK' },
                  { title: 'Polsko', value: 'PL' }
                ]"
                label="Země"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.address"
                label="Adresa"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-map-marker"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="8">
              <v-text-field
                v-model="formData.city"
                label="Město"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.postalCode"
                label="PSČ"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Popis"
                variant="outlined"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="formData.isActive"
                label="Aktivní sklad"
                color="success"
                hide-details
                inset
              ></v-switch>
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
          @click="saveWarehouse"
          :loading="saving"
        >
          {{ editingWarehouse ? 'Uložit' : 'Vytvořit' }}
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