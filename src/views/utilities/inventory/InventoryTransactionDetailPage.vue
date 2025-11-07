<!-- src/views/utilities/inventory/InventoryTransactionDetailPage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import { useProductAutocomplete } from '@/composables/useProductAutocomplete';
import type { InventoryTransaction, InventoryTransactionItem, UpdateInventoryTransactionData } from '@/services/inventoryTransactionService';

const route = useRoute();
const router = useRouter();

const transactionId = route.params.id as string;

const page = ref({ title: 'Detail skladového pohybu' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Skladové pohyby', disabled: false, href: '/inventory-transactions' },
  { title: 'Detail', disabled: true, href: '#' }
]);

const transaction = ref<InventoryTransaction | null>(null);
const items = ref<InventoryTransactionItem[]>([]);
const loading = ref(false);
const loadingItems = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const editMode = ref(false);

// **NOVÉ: Autocomplete pro přidání položky**
const {
  products: autocompleteProducts,
  loading: loadingAutocomplete,
  searchQuery: productSearchQuery
} = useProductAutocomplete();

// **NOVÉ: Autocomplete pro editaci položky**
const {
  products: autocompleteProductsEdit,
  loading: loadingAutocompleteEdit,
  searchQuery: productSearchQueryEdit
} = useProductAutocomplete();

// Bottom panel pro přidávání items
const showAddItemPanel = ref(false);
const newItem = ref<InventoryTransactionItem>({
  productId: '',
  quantity: 1,
  unitPrice: 0,
  notes: ''
});

// Dialog pro editaci jednotlivé položky
const showEditItemDialog = ref(false);
const editingItem = ref<InventoryTransactionItem | null>(null);
const editItemData = ref<InventoryTransactionItem>({
  productId: '',
  quantity: 1,
  unitPrice: 0,
  notes: ''
});

// Editovatelná data hlavičky
const editData = ref<UpdateInventoryTransactionData>({});

const itemsHeaders = ref([
  { title: 'Produkt', key: 'productName', sortable: true },
  { title: 'Množství', key: 'quantity', sortable: true },
  { title: 'Cena/ks', key: 'unitPrice', sortable: true },
  { title: 'Celkem', key: 'totalPrice', sortable: true },
  { title: 'Poznámka', key: 'notes', sortable: false },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const totalItemsAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
});

const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('cs-CZ');
};

const getStatusColor = (status: string | undefined) => {
  if (!status || status === 'draft') return 'warning';
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'error';
  return 'default';
};

const getStatusLabel = (status: string | undefined) => {
  if (!status || status === 'draft') return 'Koncept';
  if (status === 'completed') return 'Dokončeno';
  if (status === 'cancelled') return 'Zrušeno';
  return status;
};

const loadTransaction = async () => {
  loading.value = true;
  error.value = null;

  try {
    transaction.value = await inventoryTransactionService.getById(transactionId);
    page.value.title = transaction.value.name;

    editData.value = {
      name: transaction.value.name,
      transactionTypeId: transaction.value.transactionTypeId,
      warehouseFromId: transaction.value.warehouseFromId,
      warehouseId: transaction.value.warehouseFromId,
      warehouseToId: transaction.value.warehouseToId,
      transactionDate: transaction.value.transactionDate,
      notes: transaction.value.notes,
      status: transaction.value.status
    };

    await loadItems();
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání skladového pohybu';
    console.error('Chyba při načítání:', err);
  } finally {
    loading.value = false;
  }
};

const loadItems = async () => {
  loadingItems.value = true;
  try {
    items.value = await inventoryTransactionService.getItems(transactionId);
    console.log('✅ Načteny položky:', items.value);
  } catch (err) {
    console.error('Chyba při načítání položek:', err);
  } finally {
    loadingItems.value = false;
  }
};

const toggleEditMode = () => {
  if (editMode.value && transaction.value) {
    editData.value = {
      name: transaction.value.name,
      transactionTypeId: transaction.value.transactionTypeId,
      warehouseFromId: transaction.value.warehouseFromId,
      warehouseToId: transaction.value.warehouseToId,
      transactionDate: transaction.value.transactionDate,
      notes: transaction.value.notes,
      status: transaction.value.status
    };
  }
  editMode.value = !editMode.value;
};

const saveChanges = async () => {
  if (!transaction.value) return;

  saving.value = true;
  error.value = null;

  try {
    const updated = await inventoryTransactionService.update(transactionId, editData.value);
    transaction.value = updated;
    editMode.value = false;
    alert('Skladový pohyb byl úspěšně uložen');
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání skladového pohybu';
    console.error('Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

const openAddItemPanel = () => {
  newItem.value = {
    productId: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  };
  productSearchQuery.value = ''; // Reset search
  showAddItemPanel.value = true;
};

const addItem = async () => {
  if (!newItem.value.productId) {
    error.value = 'Vyberte produkt';
    return;
  }

  try {
    await inventoryTransactionService.addItem(transactionId, newItem.value);
    await loadItems();
    showAddItemPanel.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při přidávání položky';
    console.error('Chyba při přidávání položky:', err);
  }
};

const openEditItemDialog = (item: InventoryTransactionItem) => {
  editingItem.value = item;
  editItemData.value = {
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice || 0,
    notes: item.notes || ''
  };
  productSearchQueryEdit.value = ''; // Reset search
  showEditItemDialog.value = true;
};

const saveEditItem = async () => {
  if (!editingItem.value || !editingItem.value.id) return;

  if (editItemData.value.quantity <= 0) {
    error.value = 'Množství musí být větší než 0';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await inventoryTransactionService.updateItem(
      transactionId,
      editingItem.value.id,
      {
        quantity: editItemData.value.quantity,
        unitPrice: editItemData.value.unitPrice,
        notes: editItemData.value.notes
      }
    );
    
    await loadItems();
    showEditItemDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Chyba při úpravě položky';
    console.error('Chyba při úpravě položky:', err);
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (itemId: string) => {
  if (!confirm('Opravdu chcete odstranit tuto položku?')) {
    return;
  }

  try {
    await inventoryTransactionService.deleteItem(transactionId, itemId);
    await loadItems();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání položky';
    console.error('Chyba při mazání položky:', err);
  }
};

const deleteTransaction = async () => {
  if (!transaction.value) return;

  if (!confirm(`Opravdu chcete smazat skladový pohyb "${transaction.value.name}"?`)) {
    return;
  }

  try {
    await inventoryTransactionService.delete(transactionId);
    router.push('/inventory-transactions');
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání skladového pohybu';
    console.error('Chyba při mazání:', err);
  }
};

const completeTransaction = async () => {
  if (!confirm('Opravdu chcete dokončit tento skladový pohyb? Po dokončení nebude možné provádět změny.')) {
    return;
  }

  try {
    await saveChanges();
  } catch (err) {
    console.error('Chyba při dokončování:', err);
  }
};

const navigateToProduct = (productId: string) => {
  router.push(`/products/${productId}`);
};

onMounted(() => {
  loadTransaction();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row v-if="loading">
    <v-col cols="12">
      <v-card>
        <v-card-text class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="text-h6 mt-4">Načítání skladového pohybu...</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row v-else-if="error && !transaction">
    <v-col cols="12">
      <v-alert type="error" variant="tonal">
        <strong>Chyba při načítání:</strong> {{ error }}
      </v-alert>
      <v-btn color="primary" @click="router.push('/inventory-transactions')" class="mt-4">
        <v-icon start>mdi-arrow-left</v-icon>
        Zpět na seznam
      </v-btn>
    </v-col>
  </v-row>

  <v-row v-else-if="transaction">
    <v-col cols="12">
      <!-- Akční tlačítka -->
      <div class="d-flex justify-space-between align-center mb-4">
        <v-btn variant="text" @click="router.push('/inventory-transactions')">
          <v-icon start>mdi-arrow-left</v-icon>
          Zpět na seznam
        </v-btn>
        
        <div class="d-flex gap-2">
          <v-btn
            v-if="transaction.status !== 'completed' && !editMode"
            color="success"
            prepend-icon="mdi-check"
            @click="completeTransaction"
          >
            Dokončit pohyb
          </v-btn>

          <v-btn
            v-if="transaction.status !== 'completed' && !editMode"
            color="primary"
            prepend-icon="mdi-pencil"
            @click="toggleEditMode"
          >
            Upravit
          </v-btn>
          
          <template v-if="editMode">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-close"
              @click="toggleEditMode"
            >
              Zrušit
            </v-btn>
            <v-btn
              color="primary"
              prepend-icon="mdi-content-save"
              @click="saveChanges"
              :loading="saving"
            >
              Uložit změny
            </v-btn>
          </template>
          
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            @click="deleteTransaction"
            :disabled="transaction.status === 'completed'"
          >
            Smazat
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

      <!-- Hlavní informace -->
      <v-row>
        <v-col cols="12" md="8">
          <UiParentCard title="Základní informace">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.name"
                  label="Název pohybu"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Název pohybu</div>
                  <div class="text-h5 font-weight-bold">{{ transaction.name }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Typ pohybu</div>
                  <v-chip color="primary" class="mt-2">
                    {{ transaction.transactionTypeName }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Směr pohybu</div>
                  <v-chip :color="transaction.transactionDirection == 'typPohybu.vydej'?'error':'primary'" class="mt-2">
                    {{ transaction.transactionDirection == "typPohybu.vydej"?'Výdej':'Přijem' }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" md="6" v-if="transaction.warehouseFromName">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Sklad (z)</div>
                  <div class="text-body-1 font-weight-medium mt-2">
                    {{ transaction.warehouseFromName }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6" v-if="transaction.warehouseToName">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Sklad (do)</div>
                  <div class="text-body-1 font-weight-medium mt-2">
                    {{ transaction.warehouseToName }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.transactionDate"
                  label="Datum pohybu"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Datum pohybu</div>
                  <div class="text-body-1 font-weight-medium mt-2">
                    {{ formatDate(transaction.transactionDate) }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Status</div>
                  <v-chip 
                    :color="getStatusColor(transaction.status)"
                    class="mt-2"
                  >
                    {{ getStatusLabel(transaction.status) }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-if="editMode"
                  v-model="editData.notes"
                  label="Poznámka"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Poznámka</div>
                  <div class="text-body-1 mt-2">{{ transaction.notes || '—' }}</div>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>

          <!-- Položky -->
          <UiParentCard title="Položky pohybu" class="mt-4">
            <template v-slot:action>
              <v-btn
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                @click="openAddItemPanel"
                :disabled="transaction.status === 'completed'"
              >
                Přidat položku
              </v-btn>
            </template>

            <v-data-table
              :headers="itemsHeaders"
              :items="items"
              :loading="loadingItems"
              hide-default-footer
              class="elevation-1"
            >
              <template v-slot:item.productName="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-package-variant</v-icon>
                  <div>
                    <div 
                      class="font-weight-medium product-link" 
                      @click="navigateToProduct(item.productId)"
                    >
                      {{ item.productName }}
                      <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
                    </div>
                    <div class="text-caption text-medium-emphasis">ID: {{ item.productId }}</div>
                  </div>
                </div>
              </template>

              <template v-slot:item.quantity="{ item }">
                <span class="font-weight-bold">{{ item.quantity }}</span>
              </template>

              <template v-slot:item.unitPrice="{ item }">
                {{ formatPrice(item.unitPrice) }}
              </template>

              <template v-slot:item.totalPrice="{ item }">
                <span class="font-weight-bold text-primary">
                  {{ formatPrice(item.totalPrice) }}
                </span>
              </template>

              <template v-slot:item.notes="{ item }">
                <span class="text-medium-emphasis">{{ item.notes || '—' }}</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  @click="openEditItemDialog(item)"
                  :disabled="transaction.status === 'completed'"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteItem(item.id!)"
                  :disabled="transaction.status === 'completed'"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
                  <div class="text-h6 mt-4">Žádné položky</div>
                  <div class="text-caption text-medium-emphasis">
                    Přidejte položky kliknutím na tlačítko "Přidat položku"
                  </div>
                </div>
              </template>

              <template v-slot:bottom>
                <div class="pa-4 d-flex justify-space-between align-center bg-grey-lighten-4">
                  <div class="text-subtitle-1 font-weight-bold">
                    Celkem položek: {{ items.length }}
                  </div>
                  <div class="text-h6 font-weight-bold text-primary">
                    Celková částka: {{ formatPrice(totalItemsAmount) }}
                  </div>
                </div>
              </template>
            </v-data-table>
          </UiParentCard>
        </v-col>

        <!-- Boční panel -->
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-4">Metadata</div>
              
              <div class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis">Vytvořeno</div>
                <div class="text-body-2 mt-1">{{ formatDate(transaction.createdAt) }}</div>
                <div class="text-caption text-medium-emphasis">{{ transaction.createdByName }}</div>
              </div>

              <div class="mb-4" v-if="transaction.modifiedAt">
                <div class="text-subtitle-2 text-medium-emphasis">Upraveno</div>
                <div class="text-body-2 mt-1">{{ formatDate(transaction.modifiedAt) }}</div>
              </div>

              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Celková částka</div>
                <div class="text-h5 font-weight-bold text-primary mt-2">
                  {{ formatPrice(transaction.totalAmount || totalItemsAmount) }}
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="mt-4">
            <v-card-text>
              <div class="text-h6 mb-4">Rychlé akce</div>
              
              <v-btn 
                block 
                variant="outlined" 
                class="mb-2" 
                prepend-icon="mdi-refresh"
                @click="loadTransaction"
              >
                Obnovit data
              </v-btn>
              
              <v-btn 
                block 
                variant="outlined" 
                class="mb-2" 
                prepend-icon="mdi-printer"
              >
                Tisk
              </v-btn>
              
              <v-btn 
                block 
                variant="outlined" 
                prepend-icon="mdi-file-export"
              >
                Export
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="mt-4">
            <v-card-text>
              <div class="text-h6 mb-4">Statistiky</div>
              
              <div class="mb-3">
                <div class="d-flex justify-space-between">
                  <span class="text-body-2 text-medium-emphasis">Počet položek:</span>
                  <span class="font-weight-bold">{{ items.length }}</span>
                </div>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-space-between">
                  <span class="text-body-2 text-medium-emphasis">Celkové množství:</span>
                  <span class="font-weight-bold">
                    {{ items.reduce((sum, item) => sum + item.quantity, 0) }}
                  </span>
                </div>
              </div>

              <div>
                <div class="d-flex justify-space-between">
                  <span class="text-body-2 text-medium-emphasis">Průměrná cena:</span>
                  <span class="font-weight-bold">
                    {{ formatPrice(items.length > 0 ? totalItemsAmount / items.length : 0) }}
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <!-- **VYLEPŠENÉ: Bottom panel s autocomplete** -->
  <v-bottom-sheet v-model="showAddItemPanel" inset>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Přidat položku</span>
        <v-btn icon variant="text" @click="showAddItemPanel = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <!-- **AUTOCOMPLETE místo statického selectu** -->
            <v-autocomplete
              v-model="newItem.productId"
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
            >
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-package-variant</v-icon>
                  </template>
                  <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    Kód: {{ item.raw.code }} | {{ formatPrice(item.raw.priceWithoutVat || 0) }}
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

          <v-col cols="12" md="2">
            <v-text-field
              v-model.number="newItem.quantity"
              label="Množství *"
              type="number"
              variant="outlined"
              density="comfortable"
              min="0.001"
              step="0.001"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="2">
            <v-text-field
              v-model.number="newItem.unitPrice"
              label="Cena/ks"
              type="number"
              variant="outlined"
              density="comfortable"
              suffix="Kč"
              step="0.01"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="newItem.notes"
              label="Poznámka"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="outlined" @click="showAddItemPanel = false">
          Zrušit
        </v-btn>
        <v-btn color="primary" @click="addItem">
          Přidat položku
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>

  <!-- **VYLEPŠENÉ: Dialog s autocomplete** -->
  <v-dialog v-model="showEditItemDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Upravit položku</span>
        <v-btn icon variant="text" @click="showEditItemDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          <div class="d-flex align-center">
            <v-icon start>mdi-information</v-icon>
            <div>
              <div class="font-weight-medium">{{ editingItem?.productName }}</div>
              <div class="text-caption">Upravte množství, cenu nebo poznámku</div>
            </div>
          </div>
        </v-alert>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="editItemData.quantity"
              label="Množství *"
              type="number"
              variant="outlined"
              density="comfortable"
              min="0.001"
              step="0.001"
              prepend-inner-icon="mdi-counter"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="editItemData.unitPrice"
              label="Cena za jednotku"
              type="number"
              variant="outlined"
              density="comfortable"
              suffix="Kč"
              prepend-inner-icon="mdi-currency-usd"
              step="0.01"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="editItemData.notes"
              label="Poznámka"
              variant="outlined"
              rows="3"
              prepend-inner-icon="mdi-note-text"
            ></v-textarea>
          </v-col>

          <!-- Výpočet celkové ceny -->
          <v-col cols="12" v-if="editItemData.quantity && editItemData.unitPrice">
            <v-alert type="success" variant="tonal" density="compact">
              <div class="d-flex justify-space-between align-center">
                <span>Celková cena:</span>
                <span class="text-h6 font-weight-bold">
                  {{ formatPrice(editItemData.quantity * editItemData.unitPrice) }}
                </span>
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="showEditItemDialog = false">
          Zrušit
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveEditItem"
          :loading="saving"
        >
          Uložit změny
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
:deep(.v-card) {
  border-radius: 8px;
}

:deep(.v-data-table) {
  border-radius: 8px;
}

.product-link {
  cursor: pointer;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
}

.product-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
</style>