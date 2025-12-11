<!-- src/views/utilities/inventory/InventoryTransactionCreatePage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import { inventoryTransactionTypeService } from '@/services/inventoryTransactionTypeService';
import { warehouseService } from '@/services/warehouseService';
import { uomService } from '@/services/uomService';
import { settingsService } from '@/services/settingsService';
import { useProductAutocomplete } from '@/composables/useProductAutocomplete';
import { useSupplierAutocomplete } from '@/composables/useSupplierAutocomplete';
import type { CreateInventoryTransactionData, InventoryTransactionItem } from '@/services/inventoryTransactionService';
import type { InventoryTransactionType } from '@/services/inventoryTransactionTypeService';
import type { UOM } from '@/services/uomService';

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
const uoms = ref<UOM[]>([]);
const loadingTypes = ref(false);
const loadingWarehouses = ref(false);
const loadingUoms = ref(false);

// **NOVÉ: Autocomplete pro produkty**
const {
  products: autocompleteProducts,
  loading: loadingAutocomplete,
  searchQuery: productSearchQuery,
  loadProductById
} = useProductAutocomplete();

// **NOVÉ: Autocomplete pro dodavatele**
const {
  suppliers: autocompleteSuppliers,
  loading: loadingSupplierAutocomplete,
  searchQuery: supplierSearchQuery
} = useSupplierAutocomplete();

// **NOVÉ: Smart settings z API**
const smartSettings = ref<{
  defaultInventoryTransactionType: string;
  defaultMaterialsWarehouseId: string;
  defaultProductWarehouseId: string;
} | null>(null);

const formData = ref<CreateInventoryTransactionData>({
  name: '',
  transactionTypeId: '',
  transactionDirection: 'typPohybu.prijem',
  warehouseId: null, // **UPRAVENO: Jedno pole místo warehouseFrom a warehouseTo**
  transactionDate: new Date().toISOString().split('T')[0],
  description: '',
  items: []
});

// **NOVÉ: ID vybraného dodavatele**
const selectedSupplierId = ref<string>('');

// **NOVÉ: Watch pro aktualizaci názvu podle dodavatele (JEN pro příjemky)**
watch(selectedSupplierId, (newSupplierId) => {
  if (newSupplierId && formData.value.transactionDirection === 'typPohybu.prijem') {
    const supplier = autocompleteSuppliers.value.find(s => s.id === newSupplierId);
    if (supplier) {
      formData.value.name = supplier.name;
      console.log('✅ Název pohybu aktualizován podle dodavatele:', supplier.name);
    }
  }
});

// **NOVÉ: Watch pro automatické nastavení názvu u výdejek**
watch(() => formData.value.transactionDirection, (newDirection) => {
  if (newDirection === 'typPohybu.vydej') {
    formData.value.name = 'NaturalProtein';
    console.log('✅ Název pohybu automaticky nastaven pro výdej:', formData.value.name);
  } else if (newDirection === 'typPohybu.prijem') {
    // Pro příjemky resetovat název, pokud ještě není vyplněn
    if (formData.value.name === 'NaturalProtein') {
      formData.value.name = '';
    }
  }
});

// **OPRAVA: Lokální cache produktů - NIKDY se nevyprázdní**
const productCache = ref<typeof autocompleteProducts.value>([]);

// Watch pro přidání nových produktů z autocomplete do cache
watch(autocompleteProducts, (newProducts) => {
  newProducts.forEach(product => {
    if (!productCache.value.find(p => p.id === product.id)) {
      productCache.value.push(product);
    }
  });
});

// Computed property pro items - obsahuje cache + aktuální výsledky vyhledávání
const productAutocompleteItems = computed(() => {
  // Začni s cache
  const items = [...productCache.value];

  // Přidej nové produkty z autocomplete (pokud už nejsou v cache)
  autocompleteProducts.value.forEach(product => {
    if (!items.find(p => p.id === product.id)) {
      items.push(product);
    }
  });

  return items;
});

// **OPRAVA: Po výběru produktu resetovat search query**
const handleProductSelect = (productId: string | null) => {
  if (productId) {
    // Resetovat search query aby se nespustil nový API call
    productSearchQuery.value = '';
    console.log('✅ Produkt vybrán, search query resetován');
  }
};

const localItems = ref<InventoryTransactionItem[]>([]);

const formValid = ref(false);

const rules = {
  required: (v: string) => !!v || 'Toto pole je povinné',
  requiredType: (v: string) => !!v || 'Typ pohybu je povinný',
  requiredDirection: (v: string) => !!v || 'Směr pohybu je povinný'
};

const transactionDirections = ref([
  {
    value: 'typPohybu.prijem',
    title: 'Příjem',
    description: 'Příjem zboží na sklad',
    icon: 'mdi-arrow-down-circle',
    color: 'success'
  },
  {
    value: 'typPohybu.vydej',
    title: 'Výdej',
    description: 'Výdej zboží ze skladu',
    icon: 'mdi-arrow-up-circle',
    color: 'error'
  }
]);

const showAddItemDialog = ref(false);
const dialogError = ref<string | null>(null); // **NOVÉ: Lokální chyba pro dialog**
const newItem = ref<InventoryTransactionItem & { uomId?: string }>({
  productId: '',
  quantity: 1,
  unitPrice: 0,
  uomId: ''
});

const selectedType = computed(() => {
  return transactionTypes.value.find(t => t.id === formData.value.transactionTypeId);
});

const selectedDirection = computed(() => {
  return transactionDirections.value.find(d => d.value === formData.value.transactionDirection);
});

const requiresWarehouseFrom = computed(() => {
  if (!selectedType.value) return false;
  return selectedType.value.abraId === 1 || selectedType.value.abraId === 2;
});

const requiresWarehouseTo = computed(() => {
  if (!selectedType.value) return false;
  return selectedType.value.abraId === 2 || selectedType.value.abraId === 3;
});

const totalItemsAmount = computed(() => {
  return localItems.value.reduce((sum, item) => {
    const price = item.unitPrice || 0;
    const quantity = item.quantity || 0;
    return sum + (price * quantity);
  }, 0);
});

const selectedWarehouseName = computed(() => {
  if (!formData.value.warehouseId) return 'Žádný (přidejte položky)';
  const warehouse = warehouses.value.find(w => w.id === formData.value.warehouseId);
  return warehouse?.name || 'Neznámý sklad';
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const loadTransactionTypes = async () => {
  loadingTypes.value = true;
  try {
    const response = await inventoryTransactionTypeService.getAll();
    transactionTypes.value = response.list;
    
    console.log('✅ Načteny typy pohybů:', transactionTypes.value.length);
  } catch (err) {
    console.error('❌ Chyba při načítání typů:', err);
    error.value = 'Chyba při načítání typů pohybů';
  } finally {
    loadingTypes.value = false;
  }
};

const loadWarehouses = async () => {
  loadingWarehouses.value = true;
  try {
    warehouses.value = await warehouseService.getAllSimple();
    console.log('✅ Načteny sklady:', warehouses.value.length);
  } catch (err) {
    console.error('❌ Chyba při načítání skladů:', err);
    error.value = 'Chyba při načítání skladů';
  } finally {
    loadingWarehouses.value = false;
  }
};

const loadUoms = async () => {
  loadingUoms.value = true;
  try {
    const response = await uomService.getAll();
    uoms.value = response.list;
    console.log('✅ Načteny jednotky:', uoms.value.length);
  } catch (err) {
    console.error('❌ Chyba při načítání jednotek:', err);
    error.value = 'Chyba při načítání jednotek';
  } finally {
    loadingUoms.value = false;
  }
};

const loadDataAndSetDefaults = async () => {
  // **NOVÉ: Načtení smart settings**
  try {
    smartSettings.value = await settingsService.getSmartSettings();
    console.log('✅ Smart settings načteny:', smartSettings.value);
  } catch (err) {
    console.error('❌ Chyba při načítání smart settings:', err);
    error.value = 'Chyba při načítání nastavení systému';
  }

  await Promise.all([loadTransactionTypes(), loadWarehouses(), loadUoms()]);

  // **UPRAVENO: Auto-set default transaction type ze settings**
  if (!formData.value.transactionTypeId && smartSettings.value) {
    formData.value.transactionTypeId = smartSettings.value.defaultInventoryTransactionType;
    console.log('✅ Auto-vybrán defaultní typ pohybu ze settings:', formData.value.transactionTypeId);

    const defaultType = transactionTypes.value.find(t => t.id === smartSettings.value!.defaultInventoryTransactionType);
    if (defaultType) {
      console.log('✅ Defaultní typ nalezen:', defaultType.name);
    } else {
      console.warn('⚠️ Defaultní typ s ID', smartSettings.value.defaultInventoryTransactionType, 'nebyl nalezen');
      if (transactionTypes.value.length > 0) {
        formData.value.transactionTypeId = transactionTypes.value[0].id;
        console.log('✅ Použit fallback - první dostupný typ:', transactionTypes.value[0].name);
      }
    }
  }

  // **ODEBRÁNO: Automatické nastavení skladu - nyní se nastaví podle typu produktu**

  // Pre-fill transaction direction based on query parameter
  const direction = router.currentRoute.value.query.direction as string;
  if (direction === 'vydej') {
    formData.value.transactionDirection = 'typPohybu.vydej';
    console.log('✅ Předvyplněn směr: Výdej');
  } else if (direction === 'prijem') {
    formData.value.transactionDirection = 'typPohybu.prijem';
    console.log('✅ Předvyplněn směr: Příjem');
  }
};

const openAddItemDialog = () => {
  newItem.value = {
    productId: '',
    quantity: 1,
    unitPrice: 0,
    uomId: ''
  };
  productSearchQuery.value = ''; // Reset search
  dialogError.value = null; // **NOVÉ: Reset lokální chyby**
  showAddItemDialog.value = true;
};

const addItemToLocal = () => {
  dialogError.value = null; // **NOVÉ: Reset lokální chyby před validací**

  if (!newItem.value.productId) {
    dialogError.value = 'Vyberte produkt';
    return;
  }

  if (!newItem.value.quantity || newItem.value.quantity <= 0) {
    dialogError.value = 'Zadejte platné množství';
    return;
  }

  if (!newItem.value.uomId) {
    dialogError.value = 'Vyberte jednotku';
    return;
  }

  const product = autocompleteProducts.value.find(p => p.id === newItem.value.productId);
  const uom = uoms.value.find(u => u.id === newItem.value.uomId);

  // **NOVÉ: Validace - nelze míchat materiály a produkty**
  if (localItems.value.length > 0) {
    const firstItemStockType = localItems.value[0].stockType;
    if (product?.stockType !== firstItemStockType) {
      const firstItemType = firstItemStockType === 'typZasoby.vyrobek' ? 'produkty' : 'materiály';
      const currentItemType = product?.stockType === 'typZasoby.vyrobek' ? 'produkty' : 'materiály';
      dialogError.value = `Nelze míchat ${firstItemType} a ${currentItemType} v jedné transakci. Všechny položky musí být buď materiály nebo produkty.`;
      return;
    }
  }

  const itemToAdd: InventoryTransactionItem = {
    productId: newItem.value.productId,
    productName: product?.name || 'Neznámý produkt',
    stockType: product?.stockType,
    uomName: uom?.name,
    quantity: newItem.value.quantity,
    unitPrice: newItem.value.unitPrice || 0,
    totalPrice: (newItem.value.quantity || 0) * (newItem.value.unitPrice || 0)
  };

  localItems.value.push(itemToAdd);

  // **NOVÉ: Automatické nastavení skladu podle typu prvního produktu**
  if (localItems.value.length === 1 && smartSettings.value) {
    const isMaterial = product?.stockType !== 'typZasoby.vyrobek';
    formData.value.warehouseId = isMaterial
      ? smartSettings.value.defaultMaterialsWarehouseId
      : smartSettings.value.defaultProductWarehouseId;

    const warehouseName = warehouses.value.find(w => w.id === formData.value.warehouseId)?.name || 'Neznámý';
    console.log(`✅ Automaticky nastaven sklad: ${warehouseName} (${isMaterial ? 'suroviny' : 'produkty'})`);
  }

  showAddItemDialog.value = false;
  dialogError.value = null; // **UPRAVENO: Clear lokální chybu místo globální**
};

const removeItemFromLocal = (index: number) => {
  localItems.value.splice(index, 1);

  // **NOVÉ: Reset skladu když už nejsou žádné položky**
  if (localItems.value.length === 0) {
    formData.value.warehouseId = null;
    console.log('✅ Sklad resetován - žádné položky');
  }
};

const createTransaction = async () => {
  if (!formValid.value) {
    error.value = 'Vyplňte prosím všechna povinná pole';
    return;
  }

  if (!formData.value.warehouseId) {
    error.value = 'Je nutné vybrat sklad (přidejte alespoň jednu položku)';
    return;
  }

  if (localItems.value.length === 0) {
    error.value = 'Přidejte alespoň jednu položku do transakce';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    // **UPRAVENO: Mapování warehouseId na warehouseFromId/warehouseToId podle směru**
    const dataToSend: CreateInventoryTransactionData = {
      ...formData.value,
      warehouseId: formData.value.warehouseId,
      items: localItems.value.length > 0 ? localItems.value.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        uomName: item.uomName
      })) : null
    };

    console.log('📤 Odesílám data s items:', dataToSend);
    const created = await inventoryTransactionService.create(dataToSend);
    console.log('✅ Skladový pohyb vytvořen s items:', created);
    router.push(`/inventory-transactions/${created.id}`);
  } catch (err: any) {
    error.value = err.message || 'Chyba při vytváření skladového pohybu';
    console.error('❌ Chyba při vytváření:', err);
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

const getTypeIcon = (abraId: number) => {
  switch (abraId) {
    case 1:
      return 'mdi-package-variant';
    case 2:
      return 'mdi-swap-horizontal';
    case 3:
      return 'mdi-factory';
    default:
      return 'mdi-help-circle';
  }
};

const getTypeColor = (abraId: number) => {
  switch (abraId) {
    case 1:
      return 'primary';
    case 2:
      return 'info';
    case 3:
      return 'success';
    default:
      return 'default';
  }
};

const getStockTypeIcon = (stockType: string | undefined) => {
  if (stockType === 'typZasoby.vyrobek') {
    return 'mdi-food-drumstick';
  }
  // Default pro typZasoby.material a ostatní
  return 'mdi-package-variant';
};

onMounted(() => {
  loadDataAndSetDefaults();
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
            :disabled="!formValid || loadingTypes || loadingWarehouses"
          >
            Vytvořit pohyb{{ localItems.length > 0 ? ` (${localItems.length} položek)` : '' }}
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
        <v-col cols="12">
          <v-form v-model="formValid">
            <UiParentCard title="Základní informace">
              <v-row>
                <v-col cols="12">
                  <!-- **PŘÍJEMKY: Autocomplete pro dodavatele** -->
                  <v-autocomplete
                    v-if="formData.transactionDirection === 'typPohybu.prijem'"
                    v-model="selectedSupplierId"
                    v-model:search="supplierSearchQuery"
                    :items="autocompleteSuppliers"
                    item-title="name"
                    item-value="id"
                    label="Dodavatel *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-domain"
                    :loading="loadingSupplierAutocomplete"
                    :rules="[rules.required]"
                    placeholder="Začněte psát pro vyhledání dodavatele..."
                    hint="Vyberte dodavatele - název se automaticky doplní"
                    persistent-hint
                    no-filter
                    clearable
                  >
                    <template v-slot:item="{ props: itemProps, item }">
                      <v-list-item v-bind="itemProps">
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-domain</v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">
                          {{ item.raw.website || 'Bez webové stránky' }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>

                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>
                          {{ supplierSearchQuery.length < 2
                            ? 'Začněte psát pro vyhledání dodavatelů (min. 2 znaky)'
                            : 'Žádní dodavatelé nenalezeni' }}
                        </v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-autocomplete>

                  <!-- **VÝDEJKY: Textové pole Název s předvyplněnou hodnotou** -->
                  <v-text-field
                    v-else-if="formData.transactionDirection === 'typPohybu.vydej'"
                    v-model="formData.name"
                    label="Název *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-text"
                    :rules="[rules.required]"
                    hint="Název výdejky (předvyplněno NaturalProtein)"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.transactionDirection"
                    :items="transactionDirections"
                    item-title="title"
                    item-value="value"
                    label="Směr pohybu *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-arrow-left-right"
                    :rules="[rules.requiredDirection]"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon :color="item.raw.color">
                            {{ item.raw.icon }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">
                          {{ item.raw.description }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      <v-chip :color="item.raw.color" size="small" variant="tonal">
                        <v-icon start size="small">{{ item.raw.icon }}</v-icon>
                        {{ item.raw.title }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="formData.description"
                    label="Poznámka"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-note-text"
                    rows="3"
                    hint="Poznámka ke skladovému pohybu"
                    persistent-hint
                  ></v-textarea>
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
                  @click="openAddItemDialog"
                >
                  Přidat položku
                </v-btn>
              </template>

              <div v-if="localItems.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
                <div class="text-h6 mt-4">Žádné položky</div>
                <div class="text-caption text-medium-emphasis">
                  Přidejte položky kliknutím na tlačítko "Přidat položku"
                </div>
              </div>

              <v-list v-else>
                <v-list-item
                  v-for="(item, index) in localItems"
                  :key="index"
                  class="border-b"
                >
                  <template v-slot:prepend>
                    <v-icon color="primary">{{ getStockTypeIcon(item.stockType) }}</v-icon>
                  </template>
                  <v-list-item-title>{{ item.productName }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <template v-if="formData.transactionDirection === 'typPohybu.vydej' && item.requestedQuantity !== undefined && item.requestedQuantity !== null">
                      Požadované: {{ item.requestedQuantity }} {{ item.uomName || '' }} |
                    </template>
                    Množství: {{ item.quantity }} {{ item.uomName || '' }} |
                    Cena: {{ formatPrice(item.unitPrice || 0) }} |
                    Celkem: {{ formatPrice((item.quantity || 0) * (item.unitPrice || 0)) }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeItemFromLocal(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>

              <v-divider v-if="localItems.length > 0" class="my-4"></v-divider>

              <div v-if="localItems.length > 0" class="d-flex justify-space-between align-center pa-4 bg-grey-lighten-4">
                <div class="text-subtitle-1 font-weight-bold">
                  Celkem položek: {{ localItems.length }}
                </div>
                <div class="text-h6 font-weight-bold text-primary">
                  Celková částka: {{ formatPrice(totalItemsAmount) }}
                </div>
              </div>
            </UiParentCard>

            <!-- Souhrn - přesunutý dolů -->
            <UiParentCard title="Souhrn" class="mt-4">
              <v-row>
                <v-col cols="12" md="4">
                  <div class="text-center pa-4">
                    <div class="text-subtitle-2 text-medium-emphasis">Položky</div>
                    <div class="text-h4 font-weight-bold mt-2">{{ localItems.length }}</div>
                  </div>
                </v-col>

                <v-col cols="12" md="4">
                  <div class="text-center pa-4">
                    <div class="text-subtitle-2 text-medium-emphasis">Celková částka</div>
                    <div class="text-h4 font-weight-bold text-primary mt-2">
                      {{ formatPrice(totalItemsAmount) }}
                    </div>
                  </div>
                </v-col>

                <v-col cols="12" md="4">
                  <div class="text-center pa-4">
                    <div class="text-subtitle-2 text-medium-emphasis">Datum</div>
                    <div class="text-h6 font-weight-medium mt-2">Dnešní den</div>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-2"></v-divider>

              <v-row>
                <v-col cols="12" class="text-center">
                  <div class="text-caption text-medium-emphasis">
                    Typ: Standardní skladový pohyb | Sklad: {{ selectedWarehouseName }} | Směr: {{ formData.transactionDirection === 'typPohybu.prijem' ? 'Příjem' : 'Výdej' }}
                  </div>
                </v-col>
              </v-row>
            </UiParentCard>
          </v-form>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <!-- **VYLEPŠENÉ: Dialog s autocomplete** -->
  <v-dialog v-model="showAddItemDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Přidat položku</span>
        <v-btn icon variant="text" @click="showAddItemDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <!-- **NOVÉ: Chybová hláška v dialogu** -->
        <v-alert
          v-if="dialogError"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="dialogError = null"
        >
          <strong>Chyba:</strong> {{ dialogError }}
        </v-alert>

        <v-row>
          <v-col cols="12">
            <!-- **AUTOCOMPLETE místo statického selectu** -->
            <v-autocomplete
              v-model="newItem.productId"
              v-model:search="productSearchQuery"
              :items="productAutocompleteItems"
              item-title="name"
              item-value="id"
              label="Produkt *"
              variant="outlined"
              density="comfortable"
              :loading="loadingAutocomplete"
              placeholder="Začněte psát pro vyhledání..."
              no-filter
              clearable
              @update:model-value="handleProductSelect"
            >
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template v-slot:prepend>
                    <v-icon color="primary">{{ getStockTypeIcon(item.raw.stockType) }}</v-icon>
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

          <v-col cols="12" md="4" v-if="formData.transactionDirection === 'typPohybu.vydej'">
            <v-text-field
              v-model.number="newItem.requestedQuantity"
              label="Požadované množství"
              type="number"
              variant="outlined"
              density="comfortable"
              min="0.001"
              step="0.001"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
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

          <v-col cols="12" md="4">
            <v-select
              v-model="newItem.uomId"
              :items="uoms"
              item-title="name"
              item-value="id"
              label="Jednotka *"
              variant="outlined"
              density="comfortable"
              :loading="loadingUoms"
              prepend-inner-icon="mdi-ruler"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="newItem.unitPrice"
              label="Cena/ks"
              type="number"
              variant="outlined"
              density="comfortable"
              suffix="Kč"
              step="0.01"
              :disabled="formData.transactionDirection === 'typPohybu.vydej'"
              :hint="formData.transactionDirection === 'typPohybu.vydej' ? 'Cena se doplní automaticky z posledního nákupu' : ''"
              persistent-hint
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="outlined" @click="showAddItemDialog = false">
          Zrušit
        </v-btn>
        <v-btn color="primary" @click="addItemToLocal">
          Přidat
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>