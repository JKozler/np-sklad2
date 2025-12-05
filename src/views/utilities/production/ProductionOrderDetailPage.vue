<!-- src/views/utilities/production/ProductionOrderDetailPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productionOrderService } from '@/services/productionOrderService';
import type { ProductionOrder } from '@/services/productionOrderService';
import { useProductAutocomplete } from '@/composables/useProductAutocomplete';
import { useProductionWorkerAutocomplete } from '@/composables/useProductionWorkerAutocomplete';

const route = useRoute();
const router = useRouter();

const orderId = computed(() => route.params.id as string);
const isNewOrder = computed(() => orderId.value === 'new');

const page = ref({ title: isNewOrder.value ? 'Nový výrobní příkaz' : 'Detail výrobního příkazu' });
const breadcrumbs = ref([
  { title: 'Výroba', disabled: false, href: '#' },
  { title: 'Výrobní příkazy', disabled: false, href: '/production-orders' },
  { title: isNewOrder.value ? 'Nový' : 'Detail', disabled: true, href: '#' }
]);

const order = ref<ProductionOrder | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const editMode = ref(isNewOrder.value);

// Product autocomplete
const {
  products: autocompleteProducts,
  loading: loadingAutocomplete,
  searchQuery: productSearchQuery,
  loadProductById
} = useProductAutocomplete();

// Production Worker autocomplete
const {
  workers: autocompleteWorkers,
  loading: loadingWorkerAutocomplete,
  searchQuery: workerSearchQuery,
  loadAllWorkers
} = useProductionWorkerAutocomplete();

// Editovatelné fieldy
const editForm = ref({
  name: '',
  description: '',
  status: 'PLANNED',
  date: '',
  quantity: 1,
  productId: '',
  productionWorkerId: null as string | null
});

// Status options
const statusOptions = [
  { value: 'PLANNED', title: 'Plánováno', color: 'info' },
  { value: 'IN_PROGRESS', title: 'Probíhá', color: 'warning' },
  { value: 'PRODUCED', title: 'Vyrobeno', color: 'success' },
  { value: 'CANCELLED', title: 'Zrušeno', color: 'error' }
];

const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PRODUCED': 'success',
    'IN_PROGRESS': 'warning',
    'PLANNED': 'info',
    'CANCELLED': 'error'
  };
  return statusMap[status] || 'default';
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PRODUCED': 'Vyrobeno',
    'IN_PROGRESS': 'Probíhá',
    'PLANNED': 'Plánováno',
    'CANCELLED': 'Zrušeno'
  };
  return statusMap[status] || status;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const getStockTypeIcon = (stockType: string | undefined) => {
  if (stockType === 'typZasoby.vyrobek') {
    return 'mdi-food-drumstick';
  }
  // Default pro typZasoby.material a ostatní
  return 'mdi-package-variant';
};

const getStockTypeLabel = (stockType: string | undefined) => {
  if (stockType === 'typZasoby.vyrobek') {
    return 'Produkt';
  }
  return 'Surovina';
};

/**
 * Načte výrobní příkaz
 */
const loadOrder = async () => {
  if (isNewOrder.value) {
    // Pro nový příkaz inicializuj prázdný formulář
    editForm.value = {
      name: '',
      description: '',
      status: 'PLANNED',
      date: new Date().toISOString().split('T')[0], // Dnešní datum
      quantity: 1,
      productId: '',
      productionWorkerId: null
    };
    return;
  }

  // Ochrana proti volání API s undefined ID
  if (!orderId.value || orderId.value === 'undefined') {
    console.warn('⚠️ ProductionOrder ID is undefined, skipping load');
    error.value = 'Neplatné ID výrobního příkazu';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    order.value = await productionOrderService.getById(orderId.value);

    // Naplň editForm hodnotami z order
    editForm.value = {
      name: order.value.name || '',
      description: order.value.description || '',
      status: order.value.status || 'PLANNED',
      date: order.value.date || '',
      quantity: order.value.quantity || 1,
      productId: order.value.productId || '',
      productionWorkerId: order.value.productionWorkerId || null
    };

    console.log('✅ Načten výrobní příkaz:', order.value);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání výrobního příkazu';
    console.error('❌ Chyba při načítání:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Uložení změn
 */
const saveOrder = async () => {
  saving.value = true;
  error.value = null;

  try {
    // Pokud název není vyplněn, zkopíruj název produktu
    if (!editForm.value.name.trim() && editForm.value.productId) {
      const selectedProduct = autocompleteProducts.value.find(p => p.id === editForm.value.productId);
      if (selectedProduct) {
        editForm.value.name = selectedProduct.name;
      }
    }

    if (isNewOrder.value) {
      // CREATE
      const newOrder = await productionOrderService.create(editForm.value);
      console.log('✅ Vytvořen výrobní příkaz:', newOrder);

      // Přesměruj na detail nově vytvořeného příkazu
      router.push(`/production-orders/${newOrder.id}`);
    } else {
      // UPDATE
      const updatedOrder = await productionOrderService.update(orderId.value, editForm.value);
      order.value = updatedOrder;
      editMode.value = false;
      console.log('✅ Uložen výrobní příkaz:', updatedOrder);

      // Znovu načti data pro jistotu
      await loadOrder();
    }
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání výrobního příkazu';
    console.error('❌ Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Zrušení editace
 */
const cancelEdit = () => {
  if (isNewOrder.value) {
    router.push('/production-orders');
  } else {
    editMode.value = false;
    // Resetuj formulář
    if (order.value) {
      editForm.value = {
        name: order.value.name || '',
        description: order.value.description || '',
        status: order.value.status || 'PLANNED',
        date: order.value.date || '',
        quantity: order.value.quantity || 1,
        productId: order.value.productId || '',
        productionWorkerId: order.value.productionWorkerId || null
      };
    }
  }
};

/**
 * Smazání výrobního příkazu
 */
const deleteOrder = async () => {
  if (!order.value) return;

  if (!confirm(`Opravdu chcete smazat výrobní příkaz "${order.value.name}"?`)) {
    return;
  }

  try {
    await productionOrderService.delete(orderId.value);
    console.log('✅ Smazán výrobní příkaz');
    router.push('/production-orders');
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání výrobního příkazu';
    console.error('❌ Chyba při mazání:', err);
  }
};

/**
 * Načte produkt a předvyplní název
 */
watch(() => editForm.value.productId, async (newProductId) => {
  if (!newProductId) return;

  // Pokud uživatel ještě nezadal název, zkopíruj ho z produktu
  if (!editForm.value.name.trim()) {
    const selectedProduct = autocompleteProducts.value.find(p => p.id === newProductId);
    if (selectedProduct) {
      editForm.value.name = selectedProduct.name;
    } else {
      // Načti produkt z API
      const product = await loadProductById(newProductId);
      if (product) {
        editForm.value.name = product.name;
      }
    }
  }
});

onMounted(() => {
  loadOrder();
  // Načti pracovníky pro autocomplete
  loadAllWorkers();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <v-row>
    <v-col cols="12">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="text-h6 mt-4">Načítání výrobního příkazu...</div>
      </div>

      <!-- Error state -->
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

      <!-- Order Detail -->
      <div v-if="!loading && (order || isNewOrder)">
        <!-- Error message alert -->
        <v-alert
          v-if="order?.errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          prominent
        >
          <div class="d-flex align-center">
            <v-icon size="large" class="mr-4">mdi-alert-circle</v-icon>
            <div>
              <div class="text-h6 mb-2">Chybová zpráva:</div>
              <div class="text-body-1" style="white-space: pre-wrap; font-family: monospace;">{{ order.errorMessage }}</div>
            </div>
          </div>
        </v-alert>

        <!-- Main card -->
        <UiParentCard :title="isNewOrder ? 'Nový výrobní příkaz' : 'Detail výrobního příkazu'">
          <template v-slot:action>
            <div class="d-flex gap-2">
              <v-btn
                v-if="!editMode && !isNewOrder"
                color="primary"
                prepend-icon="mdi-pencil"
                @click="editMode = true"
              >
                Upravit
              </v-btn>

              <v-btn
                v-if="!editMode && !isNewOrder"
                color="error"
                prepend-icon="mdi-delete"
                @click="deleteOrder"
                variant="outlined"
              >
                Smazat
              </v-btn>

              <v-btn
                v-if="editMode"
                color="success"
                prepend-icon="mdi-content-save"
                @click="saveOrder"
                :loading="saving"
              >
                {{ isNewOrder ? 'Vytvořit' : 'Uložit' }}
              </v-btn>

              <v-btn
                v-if="editMode"
                color="default"
                prepend-icon="mdi-close"
                @click="cancelEdit"
                :disabled="saving"
                variant="outlined"
              >
                Zrušit
              </v-btn>
            </div>
          </template>

          <!-- View Mode -->
          <div v-if="!editMode && order">
            <v-row>
              <!-- Základní informace -->
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title class="bg-surface">
                    <v-icon class="mr-2">mdi-information</v-icon>
                    Základní informace
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-text</v-icon>
                        </template>
                        <v-list-item-title>Název</v-list-item-title>
                        <v-list-item-subtitle>{{ order.name }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="order.productName">
                        <template v-slot:prepend>
                          <v-icon>mdi-package-variant</v-icon>
                        </template>
                        <v-list-item-title>Produkt</v-list-item-title>
                        <v-list-item-subtitle>{{ order.productName }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-calendar</v-icon>
                        </template>
                        <v-list-item-title>Datum</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(order.date) }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-counter</v-icon>
                        </template>
                        <v-list-item-title>Množství</v-list-item-title>
                        <v-list-item-subtitle>{{ order.quantity }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-flag</v-icon>
                        </template>
                        <v-list-item-title>Status</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            size="small"
                            :color="getStatusColor(order.status)"
                            variant="tonal"
                          >
                            {{ getStatusLabel(order.status) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-check-circle</v-icon>
                        </template>
                        <v-list-item-title>Zaúčtováno</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="order.productionBookedFlag ? 'success' : 'default'"
                            size="small"
                            variant="tonal"
                          >
                            <v-icon start :icon="order.productionBookedFlag ? 'mdi-check' : 'mdi-close'"></v-icon>
                            {{ order.productionBookedFlag ? 'Ano' : 'Ne' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="order.description">
                        <template v-slot:prepend>
                          <v-icon>mdi-text-long</v-icon>
                        </template>
                        <v-list-item-title>Popis</v-list-item-title>
                        <v-list-item-subtitle style="white-space: pre-wrap;">{{ order.description }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Metadata -->
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title class="bg-surface">
                    <v-icon class="mr-2">mdi-clock</v-icon>
                    Metadata
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-account-plus</v-icon>
                        </template>
                        <v-list-item-title>Vytvořil</v-list-item-title>
                        <v-list-item-subtitle>{{ order.createdByName || '—' }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-calendar-clock</v-icon>
                        </template>
                        <v-list-item-title>Vytvořeno</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDateTime(order.createdAt) }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="order.modifiedAt">
                        <template v-slot:prepend>
                          <v-icon>mdi-pencil-clock</v-icon>
                        </template>
                        <v-list-item-title>Upraveno</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDateTime(order.modifiedAt) }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="order.modifiedByName">
                        <template v-slot:prepend>
                          <v-icon>mdi-account-edit</v-icon>
                        </template>
                        <v-list-item-title>Upravil</v-list-item-title>
                        <v-list-item-subtitle>{{ order.modifiedByName }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="order.productionWorkerName">
                        <template v-slot:prepend>
                          <v-icon>mdi-account-hard-hat</v-icon>
                        </template>
                        <v-list-item-title>Pracovník výroby</v-list-item-title>
                        <v-list-item-subtitle>{{ order.productionWorkerName }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="order.inventoryTransactionName">
                        <template v-slot:prepend>
                          <v-icon>mdi-swap-horizontal</v-icon>
                        </template>
                        <v-list-item-title>Skladový pohyb</v-list-item-title>
                        <v-list-item-subtitle>{{ order.inventoryTransactionName }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Edit Mode -->
          <div v-if="editMode">
            <v-form @submit.prevent="saveOrder">
              <v-row>
                <v-col cols="12" md="6">
                  <!-- Product autocomplete - vylepšený jako v InventoryTransaction -->
                  <v-autocomplete
                    v-model="editForm.productId"
                    v-model:search="productSearchQuery"
                    :items="autocompleteProducts"
                    :loading="loadingAutocomplete"
                    label="Produkt *"
                    placeholder="Začněte psát název produktu..."
                    variant="outlined"
                    item-title="name"
                    item-value="id"
                    clearable
                    prepend-inner-icon="mdi-package-variant"
                    hint="Vyberte produkt k výrobě"
                    persistent-hint
                    no-filter
                    :rules="[v => !!v || 'Produkt je povinný']"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon color="primary">{{ getStockTypeIcon(item.raw.stockType) }}</v-icon>
                        </template>
                        <template v-slot:title>
                          {{ item.raw.name }}
                        </template>
                        <template v-slot:subtitle>
                          <span class="text-caption">
                            Kód: {{ item.raw.code }} |
                            {{ getStockTypeLabel(item.raw.stockType) }} |
                            {{ formatPrice(item.raw.priceWithoutVat || 0) }}
                          </span>
                        </template>
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
                  <!-- Název (nepovinný) -->
                  <v-text-field
                    v-model="editForm.name"
                    label="Název"
                    placeholder="Název se zkopíruje z produktu, pokud není vyplněn"
                    variant="outlined"
                    prepend-inner-icon="mdi-text"
                    hint="Název není povinný, automaticky se zkopíruje z produktu"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <!-- Datum -->
                  <v-text-field
                    v-model="editForm.date"
                    label="Datum"
                    type="date"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <!-- Množství -->
                  <v-text-field
                    v-model.number="editForm.quantity"
                    label="Množství *"
                    type="number"
                    variant="outlined"
                    prepend-inner-icon="mdi-counter"
                    :rules="[v => v > 0 || 'Množství musí být větší než 0']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <!-- Status -->
                  <v-select
                    v-model="editForm.status"
                    :items="statusOptions"
                    label="Status *"
                    variant="outlined"
                    prepend-inner-icon="mdi-flag"
                  >
                    <template v-slot:selection="{ item }">
                      <v-chip
                        :color="item.raw.color"
                        size="small"
                        variant="tonal"
                      >
                        {{ item.raw.title }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-col>

                <v-col cols="12">
                  <!-- ProductionWorker autocomplete -->
                  <v-autocomplete
                    v-model="editForm.productionWorkerId"
                    v-model:search="workerSearchQuery"
                    :items="autocompleteWorkers"
                    :loading="loadingWorkerAutocomplete"
                    label="Pracovník výroby"
                    placeholder="Vyberte pracovníka výroby..."
                    variant="outlined"
                    item-title="name"
                    item-value="id"
                    clearable
                    prepend-inner-icon="mdi-account-hard-hat"
                    hint="Volitelné - vyberte pracovníka odpovědného za výrobu"
                    persistent-hint
                    no-filter
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-account-hard-hat</v-icon>
                        </template>
                        <template v-slot:title>
                          {{ item.raw.name }}
                        </template>
                      </v-list-item>
                    </template>

                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>
                          {{ workerSearchQuery.length < 2
                            ? 'Začněte psát pro vyhledání pracovníků (min. 2 znaky)'
                            : 'Žádní pracovníci nenalezeni' }}
                        </v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="12">
                  <!-- Popis -->
                  <v-textarea
                    v-model="editForm.description"
                    label="Popis"
                    variant="outlined"
                    prepend-inner-icon="mdi-text-long"
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </UiParentCard>
      </div>
    </v-col>
  </v-row>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

:deep(.v-card-title) {
  font-weight: 600;
}
</style>
