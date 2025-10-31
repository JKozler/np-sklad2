<!-- src/views/utilities/products/ProductDetailPage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productsService } from '@/services/productsService';
import type { Product, UpdateProductData } from '@/services/productsService';

const route = useRoute();
const router = useRouter();

const productId = route.params.id as string;

const page = ref({ title: 'Detail produktu' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Produkty', disabled: false, href: '/products' },
  { title: 'Detail', disabled: true, href: '#' }
]);

const product = ref<Product | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const editMode = ref(false);
const uoms = ref<Array<{ id: string; name: string }>>([]);
const loadingUoms = ref(false);

// Editovatelná data
const editData = ref<UpdateProductData>({});

const isModified = computed(() => {
  if (!product.value || !editMode.value) return false;
  return Object.keys(editData.value).some(key => {
    return editData.value[key as keyof UpdateProductData] !== product.value![key as keyof Product];
  });
});

const formatPrice = (price: number | null) => {
  if (price === null) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price || 0);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('cs-CZ');
};

const getStockTypeLabel = (type: string) => {
  if (type === 'typZasoby.zbozi') return 'Zboží';
  if (type === 'typZasoby.material') return 'Materiál';
  return type;
};

const loadUoms = async () => {
  loadingUoms.value = true;
  try {
    uoms.value = await productsService.getUOMs();
    console.log('✅ Načteno UOM:', uoms.value.length);
  } catch (err) {
    console.error('❌ Chyba při načítání UOM:', err);
    error.value = 'Chyba při načítání měrných jednotek';
  } finally {
    loadingUoms.value = false;
  }
};

const loadProduct = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    product.value = await productsService.getById(productId);
    page.value.title = product.value.name;
    
    // Inicializuj editData
    editData.value = {
      name: product.value.name,
      description: product.value.description,
      code: product.value.code,
      ean: product.value.ean,
      priceWithoutVat: product.value.priceWithoutVat,
      priceWithVat: product.value.priceWithVat,
      stockType: product.value.stockType,
      isStockItem: product.value.isStockItem,
      vatRate: product.value.vatRate,
      productGroupId: product.value.productGroupId,
      uomId: product.value.uomId || undefined
    };
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání produktu';
    console.error('Chyba při načítání produktu:', err);
  } finally {
    loading.value = false;
  }
};

const toggleEditMode = () => {
  if (editMode.value) {
    // Zrušení editace - obnovit původní data
    if (product.value) {
      editData.value = {
        name: product.value.name,
        description: product.value.description,
        code: product.value.code,
        ean: product.value.ean,
        priceWithoutVat: product.value.priceWithoutVat,
        priceWithVat: product.value.priceWithVat,
        stockType: product.value.stockType,
        isStockItem: product.value.isStockItem,
        vatRate: product.value.vatRate,
        productGroupId: product.value.productGroupId,
        uomId: product.value.uomId || undefined
      };
    }
  }
  editMode.value = !editMode.value;
};

const saveChanges = async () => {
  if (!product.value) return;
  
  // Validace
  if (!editData.value.uomId) {
    error.value = 'Měrná jednotka je povinná';
    return;
  }
  
  saving.value = true;
  error.value = null;
  
  try {
    console.log('📤 Odesílám update s daty:', editData.value);
    const updated = await productsService.update(productId, editData.value);
    product.value = updated;
    editMode.value = false;
    
    // Zobrazit success notifikaci
    alert('Produkt byl úspěšně uložen');
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání produktu';
    console.error('Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

const deleteProduct = async () => {
  if (!product.value) return;
  
  if (!confirm(`Opravdu chcete smazat produkt "${product.value.name}"?`)) {
    return;
  }
  
  try {
    await productsService.delete(productId);
    router.push('/products');
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání produktu';
    console.error('Chyba při mazání:', err);
  }
};

onMounted(() => {
  loadProduct();
  loadUoms();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row v-if="loading">
    <v-col cols="12">
      <v-card>
        <v-card-text class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="text-h6 mt-4">Načítání produktu...</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row v-else-if="error && !product">
    <v-col cols="12">
      <v-alert type="error" variant="tonal">
        <strong>Chyba při načítání:</strong> {{ error }}
      </v-alert>
      <v-btn color="primary" @click="router.push('/products')" class="mt-4">
        <v-icon start>mdi-arrow-left</v-icon>
        Zpět na seznam
      </v-btn>
    </v-col>
  </v-row>

  <v-row v-else-if="product">
    <v-col cols="12">
      <!-- Akční tlačítka -->
      <div class="d-flex justify-space-between align-center mb-4">
        <v-btn variant="text" @click="router.push('/products')">
          <v-icon start>mdi-arrow-left</v-icon>
          Zpět na seznam
        </v-btn>
        
        <div class="d-flex gap-2">
          <v-btn
            v-if="!editMode"
            color="primary"
            prepend-icon="mdi-pencil"
            @click="toggleEditMode"
          >
            Upravit
          </v-btn>
          
          <template v-else>
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
              :disabled="!isModified"
            >
              Uložit změny
            </v-btn>
          </template>
          
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            @click="deleteProduct"
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
                  label="Název produktu"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-package-variant"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Název produktu</div>
                  <div class="text-h5 font-weight-bold">{{ product.name }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.code"
                  label="Kód"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Kód</div>
                  <v-chip color="primary" class="mt-2">{{ product.code }}</v-chip>
                </div>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-if="editMode"
                  v-model="editData.description"
                  label="Popis"
                  variant="outlined"
                  rows="3"
                  prepend-inner-icon="mdi-text"
                ></v-textarea>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Popis</div>
                  <div class="text-body-1 mt-2">{{ product.description || '—' }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model="editData.ean"
                  label="EAN"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode-scan"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">EAN</div>
                  <div class="text-body-1 font-weight-medium mt-2">{{ product.ean || '—' }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Abra ID</div>
                  <div class="text-body-1 font-weight-medium mt-2">{{ product.abraId }}</div>
                </div>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-if="editMode"
                  v-model="editData.uomId"
                  :items="uoms"
                  item-title="name"
                  item-value="id"
                  label="Měrná jednotka *"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-ruler"
                  :loading="loadingUoms"
                  :rules="[(v: any) => !!v || 'Měrná jednotka je povinná']"
                >
                  <template v-slot:no-data>
                    <v-list-item>
                      <v-list-item-title>Žádné měrné jednotky</v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Měrná jednotka</div>
                  <v-chip color="primary" class="mt-2" v-if="product.uomName">
                    {{ product.uomName }}
                  </v-chip>
                  <span v-else class="text-body-1 font-weight-medium mt-2">—</span>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>

          <UiParentCard title="Cenové informace" class="mt-4">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-if="editMode"
                  v-model.number="editData.priceWithoutVat"
                  label="Cena bez DPH"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  suffix="Kč"
                  prepend-inner-icon="mdi-currency-usd"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Cena bez DPH</div>
                  <div class="text-h6 font-weight-bold text-primary mt-2">
                    {{ formatPrice(product.priceWithoutVat) }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-if="editMode"
                  v-model.number="editData.priceWithVat"
                  label="Cena s DPH"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  suffix="Kč"
                  prepend-inner-icon="mdi-currency-usd"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Cena s DPH</div>
                  <div class="text-h6 font-weight-bold mt-2">
                    {{ formatPrice(product.priceWithVat) }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Základní cena</div>
                  <div class="text-h6 font-weight-bold mt-2">
                    {{ formatPrice(product.price) }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Sazba DPH</div>
                  <div class="text-body-1 font-weight-medium mt-2">{{ product.vatRate }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Typ ceny</div>
                  <div class="text-body-1 font-weight-medium mt-2">{{ product.priceType }}</div>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>

          <UiParentCard title="Skladové informace" class="mt-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-if="editMode"
                  v-model="editData.stockType"
                  :items="[
                    { title: 'Zboží', value: 'typZasoby.zbozi' },
                    { title: 'Materiál', value: 'typZasoby.material' }
                  ]"
                  label="Typ zásob"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Typ zásob</div>
                  <v-chip 
                    :color="product.stockType === 'typZasoby.zbozi' ? 'primary' : 'secondary'" 
                    class="mt-2"
                  >
                    {{ getStockTypeLabel(product.stockType) }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-if="editMode"
                  v-model="editData.isStockItem"
                  label="Skladová položka"
                  color="success"
                  hide-details
                ></v-switch>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Skladová položka</div>
                  <v-chip 
                    :color="product.isStockItem ? 'success' : 'default'" 
                    class="mt-2"
                  >
                    {{ product.isStockItem ? 'Ano' : 'Ne' }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Skupina produktů</div>
                  <div class="text-body-1 font-weight-medium mt-2">{{ product.productGroupName || '—' }}</div>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>
        </v-col>

        <!-- Boční panel -->
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-4">Metadata</div>
              
              <div class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis">Vytvořeno</div>
                <div class="text-body-2 mt-1">{{ formatDate(product.createdAt) }}</div>
                <div class="text-caption text-medium-emphasis">{{ product.createdByName }}</div>
              </div>

              <div class="mb-4" v-if="product.modifiedAt">
                <div class="text-subtitle-2 text-medium-emphasis">Upraveno</div>
                <div class="text-body-2 mt-1">{{ formatDate(product.modifiedAt) }}</div>
                <div class="text-caption text-medium-emphasis">{{ product.modifiedByName }}</div>
              </div>

              <div class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis">Přiřazeno</div>
                <div class="text-body-2 mt-1">{{ product.assignedUserName || 'Nepřiřazeno' }}</div>
              </div>

              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Status</div>
                <v-chip 
                  :color="product.deleted ? 'error' : 'success'" 
                  size="small"
                  class="mt-1"
                >
                  {{ product.deleted ? 'Smazáno' : 'Aktivní' }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="mt-4">
            <v-card-text>
              <div class="text-h6 mb-4">Rychlé akce</div>
              
              <v-btn block variant="outlined" class="mb-2" prepend-icon="mdi-refresh" @click="loadProduct">
                Obnovit data
              </v-btn>
              
              <v-btn block variant="outlined" class="mb-2" prepend-icon="mdi-content-copy">
                Duplikovat
              </v-btn>
              
              <v-btn block variant="outlined" prepend-icon="mdi-file-export">
                Exportovat
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Debug info pro UOM -->
          <v-card variant="outlined" class="mt-4" v-if="editMode">
            <v-card-text>
              <div class="text-h6 mb-4">Dostupné měrné jednotky</div>
              <v-chip-group column>
                <v-chip 
                  v-for="uom in uoms" 
                  :key="uom.id"
                  size="small"
                  :color="editData.uomId === uom.id ? 'primary' : 'default'"
                >
                  {{ uom.name }}
                </v-chip>
              </v-chip-group>
              <div class="text-caption text-medium-emphasis mt-2">
                Celkem načteno: {{ uoms.length }} jednotek
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<style scoped>
:deep(.v-card) {
  border-radius: 8px;
}
</style>