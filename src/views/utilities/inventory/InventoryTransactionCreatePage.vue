<!-- src/views/utilities/inventory/InventoryTransactionCreatePage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import { inventoryTransactionTypeService } from '@/services/inventoryTransactionTypeService';
import type { CreateInventoryTransactionData } from '@/services/inventoryTransactionService';
import type { InventoryTransactionType } from '@/services/inventoryTransactionTypeService';

const router = useRouter();

const page = ref({ title: 'Nový skladový pohyb' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Skladové pohyby', disabled: false, href: '/inventory-transactions' },
  { title: 'Nový pohyb', disabled: true, href: '#' }
]);

const saving = ref(false);
const error = ref<string | null>(null);
const transactionTypes = ref<InventoryTransactionType[]>([]);
const warehouses = ref<Array<{ id: string; name: string }>>([]);
const loadingTypes = ref(false);
const loadingWarehouses = ref(false);

// Formulářová data
const formData = ref<CreateInventoryTransactionData>({
  name: '',
  inventoryTransactionTypeId: '',
  warehouseFromId: null,
  warehouseToId: null,
  transactionDate: new Date().toISOString().split('T')[0],
  notes: ''
});

const formValid = ref(false);

const rules = {
  required: (v: string) => !!v || 'Toto pole je povinné',
  requiredType: (v: string) => !!v || 'Typ pohybu je povinný'
};

// Zjisti vybraný typ pohybu
const selectedType = computed(() => {
  return transactionTypes.value.find(t => t.id === formData.value.inventoryTransactionTypeId);
});

// Určí jestli je potřeba sklad "z"
const requiresWarehouseFrom = computed(() => {
  if (!selectedType.value) return false;
  // Standardní a převodový pohyb vyžadují sklad "z"
  return selectedType.value.abraId === 1 || selectedType.value.abraId === 2;
});

// Určí jestli je potřeba sklad "do"
const requiresWarehouseTo = computed(() => {
  if (!selectedType.value) return false;
  // Převodový pohyb a výroba vyžadují sklad "do"
  return selectedType.value.abraId === 2 || selectedType.value.abraId === 3;
});

const loadTransactionTypes = async () => {
  loadingTypes.value = true;
  try {
    const response = await inventoryTransactionTypeService.getAll();
    transactionTypes.value = response.list;
    
    // Automaticky vyber první typ pokud existuje
    if (transactionTypes.value.length > 0 && !formData.value.inventoryTransactionTypeId) {
      formData.value.inventoryTransactionTypeId = transactionTypes.value[0].id;
    }
  } catch (err) {
    console.error('Chyba při načítání typů:', err);
    error.value = 'Chyba při načítání typů pohybů';
  } finally {
    loadingTypes.value = false;
  }
};

const loadWarehouses = async () => {
  loadingWarehouses.value = true;
  try {
    // TODO: Vytvoř warehouseService a načti sklady
    // Prozatím mock data
    warehouses.value = [
      { id: '1', name: 'Hlavní sklad' },
      { id: '2', name: 'Sklad výroby' },
      { id: '3', name: 'Expedice' }
    ];
  } catch (err) {
    console.error('Chyba při načítání skladů:', err);
  } finally {
    loadingWarehouses.value = false;
  }
};

const createTransaction = async () => {
  if (!formValid.value) {
    error.value = 'Vyplňte prosím všechna povinná pole';
    return;
  }

  // Validace skladů podle typu
  if (requiresWarehouseFrom.value && !formData.value.warehouseFromId) {
    error.value = 'Pro tento typ pohybu je nutné vybrat sklad (z)';
    return;
  }

  if (requiresWarehouseTo.value && !formData.value.warehouseToId) {
    error.value = 'Pro tento typ pohybu je nutné vybrat sklad (do)';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const created = await inventoryTransactionService.create(formData.value);
    router.push(`/inventory-transactions/${created.id}`);
  } catch (err: any) {
    error.value = err.message || 'Chyba při vytváření skladového pohybu';
    console.error('Chyba při vytváření:', err);
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  if (confirm('Opravdu chcete zrušit vytváření skladového pohybu? Všechny změny budou ztraceny.')) {
    router.push('/inventory-transactions');
  }
};

const getTypeDescription = (type: InventoryTransactionType | undefined) => {
  if (!type) return '';
  
  switch (type.abraId) {
    case 1:
      return 'Standardní příjem nebo výdej ze skladu';
    case 2:
      return 'Převod zboží mezi sklady';
    case 3:
      return 'Výrobní pohyb (spotřeba materiálu a příjem výrobků)';
    default:
      return '';
  }
};

onMounted(() => {
  loadTransactionTypes();
  loadWarehouses();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <!-- Akční tlačítka -->
      <div class="d-flex justify-space-between align-center mb-4">
        <v-btn variant="text" @click="cancel">
          <v-icon start>mdi-arrow-left</v-icon>
          Zpět na seznam
        </v-btn>
        
        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-close"
            @click="cancel"
          >
            Zrušit
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            @click="createTransaction"
            :loading="saving"
            :disabled="!formValid || loadingTypes"
          >
            Vytvořit pohyb
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

      <v-row>
        <v-col cols="12" md="8">
          <v-form v-model="formValid">
            <UiParentCard title="Základní informace">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.name"
                    label="Název pohybu *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-file-document"
                    :rules="[rules.required]"
                    hint="Např. 'Příjem zboží od dodavatele', 'Převod do výroby'"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.inventoryTransactionTypeId"
                    :items="transactionTypes"
                    item-title="name"
                    item-value="id"
                    label="Typ pohybu *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-swap-horizontal"
                    :rules="[rules.requiredType]"
                    :loading="loadingTypes"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon 
                            :color="item.raw.abraId === 1 ? 'primary' : item.raw.abraId === 2 ? 'info' : 'success'"
                          >
                            {{  item.raw.abraId === 1 ? 'mdi-package-variant' : 
                                item.raw.abraId === 2 ? 'mdi-swap-horizontal' : 
                                'mdi-factory' 
                            }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">
                          {{ getTypeDescription(item.raw) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.transactionDate"
                    label="Datum pohybu *"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="formData.notes"
                    label="Poznámka"
                    variant="outlined"
                    rows="3"
                    prepend-inner-icon="mdi-note-text"
                  ></v-textarea>
                </v-col>
              </v-row>
            </UiParentCard>

            <UiParentCard title="Skladové informace" class="mt-4">
              <v-alert type="info" variant="tonal" class="mb-4" v-if="selectedType">
                <div class="text-caption">
                  <strong>{{ selectedType.name }}:</strong> {{ getTypeDescription(selectedType) }}
                </div>
              </v-alert>

              <v-row>
                <v-col cols="12" md="6" v-if="requiresWarehouseFrom">
                  <v-select
                    v-model="formData.warehouseFromId"
                    :items="[
                      { title: '-- Vyberte sklad --', value: null },
                      ...warehouses.map(w => ({ title: w.name, value: w.id }))
                    ]"
                    label="Sklad (z) *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-warehouse"
                    :loading="loadingWarehouses"
                    :rules="requiresWarehouseFrom ? [rules.required] : []"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6" v-if="requiresWarehouseTo">
                  <v-select
                    v-model="formData.warehouseToId"
                    :items="[
                      { title: '-- Vyberte sklad --', value: null },
                      ...warehouses.map(w => ({ title: w.name, value: w.id }))
                    ]"
                    label="Sklad (do) *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-warehouse"
                    :loading="loadingWarehouses"
                    :rules="requiresWarehouseTo ? [rules.required] : []"
                  ></v-select>
                </v-col>
              </v-row>
            </UiParentCard>

            <v-alert type="warning" variant="tonal" class="mt-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-information</v-icon>
                <div>
                  <strong>Poznámka k položkám:</strong>
                  <div class="text-caption mt-1">
                    Položky (produkty) budete moci přidat až po vytvoření skladového pohybu 
                    pomocí bottom panelu v detailu pohybu.
                  </div>
                </div>
              </div>
            </v-alert>
          </v-form>
        </v-col>

        <!-- Boční panel s nápovědou -->
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-4">Nápověda</div>
              
              <div class="mb-3">
                <v-icon color="info" size="small" class="mr-2">mdi-information</v-icon>
                <span class="text-body-2">Pole označená * jsou povinná</span>
              </div>

              <v-divider class="my-3"></v-divider>

              <div class="text-subtitle-2 mb-2">Typy skladových pohybů:</div>
              
              <div class="mb-3" v-for="type in transactionTypes" :key="type.id">
                <v-chip 
                  size="small" 
                  :color="type.abraId === 1 ? 'primary' : type.abraId === 2 ? 'info' : 'success'"
                  class="mb-1"
                >
                  {{ type.name }}
                </v-chip>
                <div class="text-caption text-medium-emphasis">
                  {{ getTypeDescription(type) }}
                </div>
              </div>

              <v-divider class="my-3"></v-divider>

              <div class="text-subtitle-2 mb-2">Postup:</div>
              <ol class="text-body-2 text-medium-emphasis pl-4">
                <li>Vyplňte základní údaje o pohybu</li>
                <li>Vyberte typ pohybu a sklady</li>
                <li>Uložte pohyb</li>
                <li>V detailu přidejte položky (produkty)</li>
                <li>Dokončete pohyb</li>
              </ol>
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="mt-4" v-if="transactionTypes.length > 0">
            <v-card-text>
              <div class="text-h6 mb-4">Dostupné typy pohybů</div>
              
              <v-chip-group column>
                <v-chip 
                  v-for="type in transactionTypes" 
                  :key="type.id"
                  size="small"
                  :color="formData.inventoryTransactionTypeId === type.id ? 
                    (type.abraId === 1 ? 'primary' : type.abraId === 2 ? 'info' : 'success') : 
                    'default'
                  "
                  @click="formData.inventoryTransactionTypeId = type.id"
                  class="cursor-pointer"
                >
                  {{ type.name }}
                </v-chip>
              </v-chip-group>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>