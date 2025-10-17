<!-- src/views/utilities/inventory/InventoryTransactionsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import { inventoryTransactionTypeService } from '@/services/inventoryTransactionTypeService';
import type { InventoryTransaction } from '@/services/inventoryTransactionService';
import type { InventoryTransactionType } from '@/services/inventoryTransactionTypeService';

const router = useRouter();

const page = ref({ title: 'Skladové pohyby' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Skladové pohyby', disabled: true, href: '#' }
]);

const transactions = ref<InventoryTransaction[]>([]);
const transactionTypes = ref<InventoryTransactionType[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const selectedType = ref<string>('');
const selectedStatus = ref<string>('');
const dateFrom = ref<string>('');
const dateTo = ref<string>('');
const itemsPerPage = ref(20);
const page_number = ref(0);

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Typ pohybu', key: 'inventoryTransactionTypeName', sortable: true },
  { title: 'Sklad (z)', key: 'warehouseFromName', sortable: false },
  { title: 'Sklad (do)', key: 'warehouseToName', sortable: false },
  { title: 'Datum', key: 'transactionDate', sortable: true },
  { title: 'Celková částka', key: 'totalAmount', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const filteredTransactions = computed(() => {
  let filtered = [...transactions.value];

  if (selectedType.value) {
    filtered = filtered.filter(t => t.inventoryTransactionTypeId === selectedType.value);
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(t => t.status === selectedStatus.value);
  }

  if (dateFrom.value) {
    filtered = filtered.filter(t => t.transactionDate >= dateFrom.value);
  }

  if (dateTo.value) {
    filtered = filtered.filter(t => t.transactionDate <= dateTo.value);
  }

  return filtered;
});

const paginatedTransactions = computed(() => {
  const start = page_number.value * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredTransactions.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage.value);
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
};

const formatPrice = (price: number | undefined) => {
  if (!price) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'default';
  switch (status.toLowerCase()) {
    case 'draft': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getStatusLabel = (status: string | undefined) => {
  if (!status) return 'Koncept';
  switch (status.toLowerCase()) {
    case 'draft': return 'Koncept';
    case 'completed': return 'Dokončeno';
    case 'cancelled': return 'Zrušeno';
    default: return status;
  }
};

const getTypeColor = (typeId: string) => {
  // Můžeš přidat logiku podle typu pohybu
  const type = transactionTypes.value.find(t => t.id === typeId);
  if (!type) return 'default';
  
  // Podle Abra ID rozliš typ
  switch (type.abraId) {
    case 1: return 'primary';   // Standardní
    case 2: return 'info';      // Převodový
    case 3: return 'success';   // Výroba
    default: return 'default';
  }
};

const loadTransactions = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await inventoryTransactionService.getAll();
    transactions.value = response.list;
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání skladových pohybů';
    console.error('Chyba při načítání:', err);
  } finally {
    loading.value = false;
  }
};

const loadTransactionTypes = async () => {
  try {
    const response = await inventoryTransactionTypeService.getAll();
    transactionTypes.value = response.list;
  } catch (err) {
    console.error('Chyba při načítání typů pohybů:', err);
  }
};

const deleteTransaction = async (id: string, name: string) => {
  if (!confirm(`Opravdu chcete smazat skladový pohyb "${name}"?`)) {
    return;
  }

  try {
    await inventoryTransactionService.delete(id);
    await loadTransactions();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání pohybu';
    console.error('Chyba při mazání:', err);
  }
};

const resetFilters = () => {
  selectedType.value = '';
  selectedStatus.value = '';
  dateFrom.value = '';
  dateTo.value = '';
  page_number.value = 0;
};

onMounted(() => {
  loadTransactions();
  loadTransactionTypes();
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
              <div class="text-subtitle-2 text-medium-emphasis">Celkem pohybů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ transactions.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Po filtrování</div>
              <div class="text-h4 font-weight-bold mt-2">{{ filteredTransactions.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Dokončeno</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ transactions.filter(t => t.status === 'completed').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Koncepty</div>
              <div class="text-h4 font-weight-bold mt-2 text-warning">
                {{ transactions.filter(t => !t.status || t.status === 'draft').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam skladových pohybů">
        <!-- Filtry -->
        <v-expansion-panels class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-filter</v-icon>
              Filtry
              <v-chip 
                v-if="selectedType || selectedStatus || dateFrom || dateTo"
                color="primary" 
                size="small" 
                class="ml-2"
              >
                Aktivní
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="selectedType"
                    :items="[
                      { title: 'Všechny typy', value: '' },
                      ...transactionTypes.map(t => ({ title: t.name, value: t.id }))
                    ]"
                    label="Typ pohybu"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-select>
                </v-col>

                <v-col cols="12" md="3">
                  <v-select
                    v-model="selectedStatus"
                    :items="[
                      { title: 'Všechny stavy', value: '' },
                      { title: 'Koncept', value: 'draft' },
                      { title: 'Dokončeno', value: 'completed' },
                      { title: 'Zrušeno', value: 'cancelled' }
                    ]"
                    label="Status"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-select>
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="dateFrom"
                    label="Datum od"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="dateTo"
                    label="Datum do"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn
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
        <div class="d-flex justify-space-between align-center mb-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            @click="loadTransactions"
            :loading="loading"
          >
            Obnovit
          </v-btn>
          
          <v-btn
            color="success"
            prepend-icon="mdi-plus"
            @click="router.push('/inventory-transactions/new')"
          >
            Nový skladový pohyb
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
          <strong>Chyba:</strong> {{ error }}
        </v-alert>

        <!-- Tabulka -->
        <v-data-table
          :headers="headers"
          :items="paginatedTransactions"
          :loading="loading"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <router-link 
              :to="`/inventory-transactions/${item.id}`"
              class="text-primary font-weight-medium text-decoration-none"
            >
              {{ item.name }}
            </router-link>
          </template>

          <template v-slot:item.inventoryTransactionTypeName="{ item }">
            <v-chip 
              :color="getTypeColor(item.inventoryTransactionTypeId)"
              size="small"
              variant="tonal"
            >
              {{ item.inventoryTransactionTypeName }}
            </v-chip>
          </template>

          <template v-slot:item.warehouseFromName="{ item }">
            <span class="text-medium-emphasis">{{ item.warehouseFromName || '—' }}</span>
          </template>

          <template v-slot:item.warehouseToName="{ item }">
            <span class="text-medium-emphasis">{{ item.warehouseToName || '—' }}</span>
          </template>

          <template v-slot:item.transactionDate="{ item }">
            {{ formatDate(item.transactionDate) }}
          </template>

          <template v-slot:item.totalAmount="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.totalAmount) }}</span>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip 
              :color="getStatusColor(item.status)"
              size="small"
              variant="tonal"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              :to="`/inventory-transactions/${item.id}`"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              @click="deleteTransaction(item.id, item.name)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
              <div class="text-h6 mt-4">Žádné skladové pohyby</div>
              <div class="text-caption text-medium-emphasis">Vytvořte první skladový pohyb</div>
            </div>
          </template>

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Položek na stránku:</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[10, 20, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 100px"
                ></v-select>
              </div>
              
              <div class="text-body-2">
                {{ page_number * itemsPerPage + 1 }}-{{ Math.min((page_number + 1) * itemsPerPage, filteredTransactions.length) }} 
                z {{ filteredTransactions.length }}
              </div>

              <v-pagination
                v-model="page_number"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
                @update:model-value="(val) => page_number = val - 1"
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