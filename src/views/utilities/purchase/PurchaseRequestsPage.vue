<!-- src/views/utilities/purchase/PurchaseRequestsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { purchaseRequestService } from '@/services/purchaseRequestService';
import type { PurchaseRequest, CreatePurchaseRequestData } from '@/services/purchaseRequestService';
import { useProductAutocomplete } from '@/composables/useProductAutocomplete';

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

// Dialog pro vytvoření/editaci
const showDialog = ref(false);
const editingRequest = ref<PurchaseRequest | null>(null);
const saving = ref(false);

// Dialogy pro akce
const showIgnoreDialog = ref(false);
const ignoreReason = ref('');
const ignoreTargetRequest = ref<PurchaseRequest | null>(null);

const showPurchasedDialog = ref(false);
const purchasedExpectedDate = ref('');
const purchasedTargetRequest = ref<PurchaseRequest | null>(null);

const showDoneDialog = ref(false);
const doneTargetRequest = ref<PurchaseRequest | null>(null);

const showUnignoreDialog = ref(false);
const unignoreTargetRequest = ref<PurchaseRequest | null>(null);

const showDeleteDialog = ref(false);
const deleteTargetRequest = ref<PurchaseRequest | null>(null);

// Autocomplete pro produkty
const {
  products: autocompleteProducts,
  loading: loadingAutocomplete,
  searchQuery: productSearchQuery
} = useProductAutocomplete();

// Formulářová data
const formData = ref<CreatePurchaseRequestData>({
  name: '',
  status: 'New',
  productName: '',
  productId: '',
  expectedDate: '',
  orderedQuantity: 1,
  ignoredUntil: '',
  ignoredReason: '',
  description: '',
  descriptionSmall: '',
  assignedUserName: null,
  assignedUserId: null,
  teamsIds: [],
  teamsNames: {}
});

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

const openIgnoreDialog = (request: PurchaseRequest) => {
  ignoreTargetRequest.value = request;
  ignoreReason.value = '';
  showIgnoreDialog.value = true;
};

const markAsIgnored = async () => {
  if (!ignoreTargetRequest.value) return;

  try {
    await purchaseRequestService.ignore(
      ignoreTargetRequest.value.id,
      ignoreReason.value || undefined
    );
    await loadRequests();
    showIgnoreDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při označování jako ignorováno';
    console.error('Chyba:', err);
  }
};

const openPurchasedDialog = (request: PurchaseRequest) => {
  purchasedTargetRequest.value = request;
  purchasedExpectedDate.value = '';
  showPurchasedDialog.value = true;
};

const markAsPurchased = async () => {
  if (!purchasedTargetRequest.value) return;

  try {
    await purchaseRequestService.markAsPurchased(
      purchasedTargetRequest.value.id,
      purchasedExpectedDate.value || undefined
    );
    await loadRequests();
    showPurchasedDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při označování jako objednáno';
    console.error('Chyba:', err);
  }
};

const openDoneDialog = (request: PurchaseRequest) => {
  doneTargetRequest.value = request;
  showDoneDialog.value = true;
};

const markAsDone = async () => {
  if (!doneTargetRequest.value) return;

  try {
    await purchaseRequestService.markAsDone(doneTargetRequest.value.id);
    await loadRequests();
    showDoneDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při označování jako hotovo';
    console.error('Chyba:', err);
  }
};

const openUnignoreDialog = (request: PurchaseRequest) => {
  unignoreTargetRequest.value = request;
  showUnignoreDialog.value = true;
};

const unignoreRequest = async () => {
  if (!unignoreTargetRequest.value) return;

  try {
    await purchaseRequestService.unignore(unignoreTargetRequest.value.id);
    await loadRequests();
    showUnignoreDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při vrácení žádosti';
    console.error('Chyba:', err);
  }
};

const openCreateDialog = () => {
  editingRequest.value = null;
  formData.value = {
    name: '',
    status: 'New',
    productName: '',
    productId: '',
    expectedDate: '',
    orderedQuantity: 1,
    ignoredUntil: '',
    ignoredReason: '',
    description: '',
    descriptionSmall: '',
    assignedUserName: null,
    assignedUserId: null,
    teamsIds: [],
    teamsNames: {}
  };
  productSearchQuery.value = '';
  showDialog.value = true;
};

const openEditDialog = (request: PurchaseRequest) => {
  editingRequest.value = request;
  formData.value = {
    name: request.name || '',
    status: request.status,
    productName: request.productName || '',
    productId: request.productId || '',
    expectedDate: request.expectedDate || '',
    orderedQuantity: request.orderedQuantity || 1,
    ignoredUntil: request.ignoredUntil || '',
    ignoredReason: request.ignoredReason || '',
    description: request.description || '',
    descriptionSmall: request.descriptionSmall || '',
    assignedUserName: null,
    assignedUserId: null,
    teamsIds: [],
    teamsNames: {}
  };
  showDialog.value = true;
};

const saveRequest = async () => {
  if (!formData.value.productId) {
    error.value = 'Vyberte prosím produkt';
    return;
  }

  // Najdi produkt v autocomplete, abychom získali jeho název
  const selectedProduct = autocompleteProducts.value.find(p => p.id === formData.value.productId);
  if (selectedProduct) {
    formData.value.productName = selectedProduct.name;
  }

  saving.value = true;
  error.value = null;

  try {
    if (editingRequest.value) {
      await purchaseRequestService.update(editingRequest.value.id, {
        name: formData.value.name,
        status: formData.value.status,
        productName: formData.value.productName,
        productId: formData.value.productId,
        expectedDate: formData.value.expectedDate,
        orderedQuantity: formData.value.orderedQuantity,
        ignoredUntil: formData.value.ignoredUntil,
        ignoredReason: formData.value.ignoredReason,
        description: formData.value.description,
        descriptionSmall: formData.value.descriptionSmall
      });
    } else {
      await purchaseRequestService.create(formData.value);
    }

    showDialog.value = false;
    await loadRequests();
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání nákupní žádosti';
    console.error('Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (request: PurchaseRequest) => {
  deleteTargetRequest.value = request;
  showDeleteDialog.value = true;
};

const deleteRequest = async () => {
  if (!deleteTargetRequest.value) return;

  try {
    await purchaseRequestService.delete(deleteTargetRequest.value.id);
    await loadRequests();
    showDeleteDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání nákupní žádosti';
    console.error('Chyba při mazání:', err);
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

          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="loadRequests"
              :loading="loading"
            >
              Obnovit
            </v-btn>
            <v-btn
              color="success"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Nová žádost
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
              <v-tooltip text="Upravit" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="openEditDialog(item)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip text="Smazat" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="openDeleteDialog(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip v-if="item.status === 'New'" text="Označit jako objednáno" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="info"
                    @click="openPurchasedDialog(item)"
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
                    @click="openIgnoreDialog(item)"
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
                    @click="openDoneDialog(item)"
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
                    @click="openUnignoreDialog(item)"
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

  <!-- Dialog pro vytvoření/úpravu nákupní žádosti -->
  <v-dialog v-model="showDialog" max-width="800">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ editingRequest ? 'Upravit nákupní žádost' : 'Nová nákupní žádost' }}</span>
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
                label="Název žádosti"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-file-document"
                placeholder="Např. 'Objednávka surovin'"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-autocomplete
                v-model="formData.productId"
                v-model:search="productSearchQuery"
                :items="autocompleteProducts"
                item-title="name"
                item-value="id"
                label="Produkt *"
                variant="outlined"
                density="comfortable"
                :loading="loadingAutocomplete"
                placeholder="Začněte psát pro vyhledání..."
                no-filter
                clearable
                prepend-inner-icon="mdi-package-variant"
              >
                <template v-slot:item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-package-variant</v-icon>
                    </template>
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      Kód: {{ item.raw.code }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>

                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ productSearchQuery.length < 2
                        ? 'Začněte psát pro vyhledání produktů (min. 2 znaky)'
                        : 'Žádné produkty nenalezeny' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.status"
                :items="[
                  { title: 'Nový', value: 'New' },
                  { title: 'Ignorováno', value: 'Ignored' },
                  { title: 'Objednáno', value: 'Purchased' },
                  { title: 'Hotovo', value: 'Done' }
                ]"
                label="Status *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-flag"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.orderedQuantity"
                label="Objednané množství"
                type="number"
                variant="outlined"
                density="comfortable"
                min="1"
                prepend-inner-icon="mdi-numeric"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.expectedDate"
                label="Očekávané datum dodání"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.ignoredUntil"
                label="Ignorováno do"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-clock"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.ignoredReason"
                label="Důvod ignorování"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-comment-text"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Popis"
                variant="outlined"
                density="comfortable"
                rows="3"
                prepend-inner-icon="mdi-text"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.descriptionSmall"
                label="Krátký popis (HTML)"
                variant="outlined"
                density="comfortable"
                rows="2"
                prepend-inner-icon="mdi-code-tags"
                hint="Můžete použít HTML značky, např. <p>Text</p>"
                persistent-hint
              ></v-textarea>
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
          @click="saveRequest"
          :loading="saving"
        >
          {{ editingRequest ? 'Uložit' : 'Vytvořit' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro ignorování -->
  <v-dialog v-model="showIgnoreDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Ignorovat žádost</span>
        <v-btn icon variant="text" @click="showIgnoreDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <p class="mb-4">
          Opravdu chcete ignorovat žádost
          <strong>"{{ ignoreTargetRequest?.name }}"</strong>?
        </p>
        <v-textarea
          v-model="ignoreReason"
          label="Důvod ignorování (nepovinné)"
          variant="outlined"
          density="comfortable"
          rows="3"
          prepend-inner-icon="mdi-comment-text"
          placeholder="Např. není potřeba, máme na skladě..."
        ></v-textarea>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="showIgnoreDialog = false"
        >
          Ne, zrušit
        </v-btn>
        <v-btn
          color="warning"
          @click="markAsIgnored"
        >
          Ano, ignorovat
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro označení jako objednáno -->
  <v-dialog v-model="showPurchasedDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Označit jako objednáno</span>
        <v-btn icon variant="text" @click="showPurchasedDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <p class="mb-4">
          Označit žádost
          <strong>"{{ purchasedTargetRequest?.name }}"</strong>
          jako objednáno?
        </p>
        <v-text-field
          v-model="purchasedExpectedDate"
          label="Očekávané datum dodání (nepovinné)"
          type="date"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-calendar"
          hint="Vyberte datum, kdy očekáváte dodání"
          persistent-hint
        ></v-text-field>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="showPurchasedDialog = false"
        >
          Ne, zrušit
        </v-btn>
        <v-btn
          color="info"
          @click="markAsPurchased"
        >
          Ano, označit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro označení jako hotovo -->
  <v-dialog v-model="showDoneDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Označit jako hotovo</span>
        <v-btn icon variant="text" @click="showDoneDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <p>
          Opravdu chcete označit žádost
          <strong>"{{ doneTargetRequest?.name }}"</strong>
          jako hotovo?
        </p>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="showDoneDialog = false"
        >
          Ne, zrušit
        </v-btn>
        <v-btn
          color="success"
          @click="markAsDone"
        >
          Ano, označit jako hotovo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro vrácení do nových -->
  <v-dialog v-model="showUnignoreDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Vrátit do nových</span>
        <v-btn icon variant="text" @click="showUnignoreDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <p>
          Opravdu chcete vrátit žádost
          <strong>"{{ unignoreTargetRequest?.name }}"</strong>
          zpět do nových?
        </p>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="showUnignoreDialog = false"
        >
          Ne, zrušit
        </v-btn>
        <v-btn
          color="warning"
          @click="unignoreRequest"
        >
          Ano, vrátit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro smazání -->
  <v-dialog v-model="showDeleteDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center text-error">
        <span>Smazat žádost</span>
        <v-btn icon variant="text" @click="showDeleteDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-alert type="warning" variant="tonal" class="mb-4">
          <strong>Varování:</strong> Tato akce je nevratná!
        </v-alert>
        <p>
          Opravdu chcete smazat nákupní žádost
          <strong>"{{ deleteTargetRequest?.name }}"</strong>?
        </p>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="showDeleteDialog = false"
        >
          Ne, zrušit
        </v-btn>
        <v-btn
          color="error"
          @click="deleteRequest"
        >
          Ano, smazat
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
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
