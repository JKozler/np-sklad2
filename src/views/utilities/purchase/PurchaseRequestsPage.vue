<!-- src/views/utilities/purchase/PurchaseRequestsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { purchaseRequestService } from '@/services/purchaseRequestService';
import type { PurchaseRequest } from '@/services/purchaseRequestService';

const router = useRouter();

const page = ref({ title: 'Nákupní žádosti' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Nákupní žádosti', disabled: true, href: '#' }
]);

const requests = ref<PurchaseRequest[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref<'all' | 'new' | 'ignored' | 'purchased' | 'done'>('new');

const currentOffset = ref(0);
const itemsPerPage = ref(100);
const totalFromAPI = ref(0);

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Informace', key: 'descriptionSmall', sortable: false },
  { title: 'Vytvořeno', key: 'createdAt', sortable: true },
  { title: 'Očekáváme', key: 'expectedDate', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const tabStats = computed(() => {
  return {
    all: requests.value.length,
    new: requests.value.filter(r => r.status === 'New').length,
    ignored: requests.value.filter(r => r.status === 'Ignored').length,
    purchased: requests.value.filter(r => r.status === 'Purchased').length,
    done: requests.value.filter(r => r.status === 'Done').length
  };
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'New': return 'warning';
    case 'Ignored': return 'default';
    case 'Purchased': return 'info';
    case 'Done': return 'success';
    default: return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'New': return 'Nový';
    case 'Ignored': return 'Ignorováno';
    case 'Purchased': return 'Objednáno';
    case 'Done': return 'Hotovo';
    default: return status;
  }
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('cs-CZ');
};

const loadRequests = async () => {
  loading.value = true;
  error.value = null;

  try {
    const filters: any = {};

    // Filtr podle aktivního tabu
    if (activeTab.value === 'new') {
      filters.status = 'New';
    } else if (activeTab.value === 'ignored') {
      filters.status = 'Ignored';
    } else if (activeTab.value === 'purchased') {
      filters.status = 'Purchased';
    } else if (activeTab.value === 'done') {
      filters.status = 'Done';
    }

    const response = await purchaseRequestService.getAll(filters, {
      maxSize: itemsPerPage.value,
      offset: currentOffset.value
    });

    requests.value = response.list;
    totalFromAPI.value = response.total;

    console.log('✅ Načteno nákupních žádostí:', requests.value.length, '/', response.total);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání nákupních žádostí';
    console.error('❌ Chyba při načítání:', err);
  } finally {
    loading.value = false;
  }
};

const markAsIgnored = async (request: PurchaseRequest) => {
  const reason = prompt('Důvod ignorování (nepovinné):');
  if (reason === null) return; // Cancelled

  try {
    await purchaseRequestService.ignore(request.id, reason || undefined);
    await loadRequests();
  } catch (err: any) {
    error.value = err.message || 'Chyba při označování jako ignorováno';
    console.error('Chyba:', err);
  }
};

const markAsPurchased = async (request: PurchaseRequest) => {
  const expectedDate = prompt('Očekávané datum dodání (RRRR-MM-DD):');
  if (expectedDate === null) return; // Cancelled

  try {
    await purchaseRequestService.markAsPurchased(request.id, expectedDate || undefined);
    await loadRequests();
  } catch (err: any) {
    error.value = err.message || 'Chyba při označování jako objednáno';
    console.error('Chyba:', err);
  }
};

const markAsDone = async (request: PurchaseRequest) => {
  if (!confirm(`Opravdu chcete označit "${request.name}" jako hotovo?`)) {
    return;
  }

  try {
    await purchaseRequestService.markAsDone(request.id);
    await loadRequests();
  } catch (err: any) {
    error.value = err.message || 'Chyba při označování jako hotovo';
    console.error('Chyba:', err);
  }
};

const unignoreRequest = async (request: PurchaseRequest) => {
  if (!confirm(`Opravdu chcete vrátit "${request.name}" zpět do nových?`)) {
    return;
  }

  try {
    await purchaseRequestService.unignore(request.id);
    await loadRequests();
  } catch (err: any) {
    error.value = err.message || 'Chyba při vrácení žádosti';
    console.error('Chyba:', err);
  }
};

watch(activeTab, () => {
  currentOffset.value = 0;
  loadRequests();
});

onMounted(() => {
  loadRequests();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <v-row>
    <v-col cols="12">
      <!-- Taby -->
      <v-card variant="outlined" class="mb-4">
        <v-tabs
          v-model="activeTab"
          color="primary"
          align-tabs="start"
        >
          <v-tab value="new">
            <v-icon start color="warning">mdi-alert-circle</v-icon>
            Nové
            <v-chip
              size="small"
              class="ml-2"
              color="warning"
              variant="tonal"
            >
              {{ tabStats.new }}
            </v-chip>
          </v-tab>

          <v-tab value="purchased">
            <v-icon start color="info">mdi-cart</v-icon>
            Objednáno
            <v-chip
              size="small"
              class="ml-2"
              color="info"
              variant="tonal"
            >
              {{ tabStats.purchased }}
            </v-chip>
          </v-tab>

          <v-tab value="done">
            <v-icon start color="success">mdi-check-circle</v-icon>
            Hotovo
            <v-chip
              size="small"
              class="ml-2"
              color="success"
              variant="tonal"
            >
              {{ tabStats.done }}
            </v-chip>
          </v-tab>

          <v-tab value="ignored">
            <v-icon start>mdi-eye-off</v-icon>
            Ignorováno
            <v-chip
              size="small"
              class="ml-2"
              variant="tonal"
            >
              {{ tabStats.ignored }}
            </v-chip>
          </v-tab>

          <v-tab value="all">
            <v-icon start>mdi-format-list-bulleted</v-icon>
            Vše
            <v-chip
              size="small"
              class="ml-2"
              color="primary"
              variant="tonal"
            >
              {{ tabStats.all }}
            </v-chip>
          </v-tab>
        </v-tabs>
      </v-card>

      <!-- Statistiky -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="pa-3">
              <div class="text-subtitle-2 text-medium-emphasis">Celkem žádostí</div>
              <div class="text-h4 font-weight-bold mt-2">{{ totalFromAPI }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="pa-3">
              <div class="text-subtitle-2 text-medium-emphasis">Nové</div>
              <div class="text-h4 font-weight-bold mt-2 text-warning">
                {{ tabStats.new }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="pa-3">
              <div class="text-subtitle-2 text-medium-emphasis">Objednáno</div>
              <div class="text-h4 font-weight-bold mt-2 text-info">
                {{ tabStats.purchased }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="pa-3">
              <div class="text-subtitle-2 text-medium-emphasis">Hotovo</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ tabStats.done }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam nákupních žádostí">
        <!-- Toolbar -->
        <div class="mb-4 d-flex justify-space-between align-center">
          <div class="text-subtitle-2">
            Zobrazeny žádosti: <strong>{{ activeTab === 'new' ? 'Nové' : activeTab === 'purchased' ? 'Objednáno' : activeTab === 'done' ? 'Hotovo' : activeTab === 'ignored' ? 'Ignorováno' : 'Vše' }}</strong>
          </div>

          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            @click="loadRequests"
            :loading="loading"
          >
            Obnovit
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
          :items="requests"
          :loading="loading"
          :items-per-page="100"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <template v-slot:item.name="{ item }">
            <div class="font-weight-medium">{{ item.name }}</div>
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

          <template v-slot:item.descriptionSmall="{ item }">
            <div v-html="item.descriptionSmall" class="text-caption"></div>
          </template>

          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template v-slot:item.expectedDate="{ item }">
            <v-chip
              v-if="item.expectedDate"
              size="small"
              color="info"
              variant="tonal"
            >
              <v-icon start size="small">mdi-calendar</v-icon>
              {{ formatDate(item.expectedDate) }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-tooltip v-if="item.status === 'New'" text="Označit jako objednáno" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="info"
                    @click="markAsPurchased(item)"
                  >
                    <v-icon>mdi-cart</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip v-if="item.status === 'New'" text="Ignorovat" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="default"
                    @click="markAsIgnored(item)"
                  >
                    <v-icon>mdi-eye-off</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip v-if="item.status === 'Purchased'" text="Označit jako hotovo" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="success"
                    @click="markAsDone(item)"
                  >
                    <v-icon>mdi-check</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip v-if="item.status === 'Ignored'" text="Vrátit do nových" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="warning"
                    @click="unignoreRequest(item)"
                  >
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-clipboard-list</v-icon>
              <div class="text-h6 mt-4">Žádné nákupní žádosti</div>
              <div class="text-caption text-medium-emphasis">
                {{ activeTab === 'new' ? 'V kategorii "Nové" nejsou žádné žádosti.' :
                   activeTab === 'purchased' ? 'V kategorii "Objednáno" nejsou žádné žádosti.' :
                   activeTab === 'done' ? 'V kategorii "Hotovo" nejsou žádné žádosti.' :
                   activeTab === 'ignored' ? 'V kategorii "Ignorováno" nejsou žádné žádosti.' :
                   'Nejsou žádné nákupní žádosti.' }}
              </div>
            </div>
          </template>
        </v-data-table>

        <!-- Info -->
        <div class="mt-4 text-caption text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
          Celkem nákupních žádostí: <strong>{{ totalFromAPI }}</strong>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.gap-1 {
  gap: 4px;
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

/* HTML content styling */
:deep(.inventory-count) {
  font-weight: bold;
}

:deep(.inventory-count.low) {
  color: #f44336;
}

:deep(.inventory-min) {
  font-weight: bold;
  color: #2196f3;
}

:deep(.ordered-count) {
  font-weight: bold;
  color: #ff9800;
}

:deep(.expected-date) {
  font-weight: bold;
  color: #4caf50;
}
</style>
