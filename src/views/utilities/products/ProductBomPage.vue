<!-- src/views/utilities/products/ProductBomPage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import BOMTreeNode from '@/components/bom/BOMTreeNode.vue';
import { bomService } from '@/services/bomService';
import { useProductAutocomplete } from '@/composables/useProductAutocomplete';
import { productsService } from '@/services/productsService';
import type { BOMNode, CreateBOMItemData } from '@/services/bomService';
import type { Product } from '@/services/productsService';

const route = useRoute();
const router = useRouter();

const productId = route.params.id as string;

const page = ref({ title: 'Kusovník produktu' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Produkty', disabled: false, href: '/products' },
  { title: 'Detail', disabled: false, href: `/products/${productId}` },
  { title: 'Kusovník', disabled: true, href: '#' }
]);

const product = ref<Product | null>(null);
const bomTree = ref<BOMNode | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Dialog pro přidání komponenty
const showAddDialog = ref(false);
const parentNode = ref<BOMNode | null>(null);
const products = ref<Product[]>([]);
const loadingProducts = ref(false);

// Dialog pro editaci
const showEditDialog = ref(false);
const editingNode = ref<BOMNode | null>(null);

// Formulářová data
const newComponentData = ref<CreateBOMItemData>({
  assemblyProductId: productId,
  parentBomId: '',
  componentProductId: '',
  quantity: 1
});

const editComponentData = ref({
  quantity: 1,
  componentProductId: ''
});

// Computed
const hasBOM = computed(() => bomTree.value !== null);

const totalCost = computed(() => {
  if (!bomTree.value) return 0;
  return calculateTotalCost(bomTree.value);
});

const bomItemsCount = computed(() => {
  if (!bomTree.value) return 0;
  return countBOMItems(bomTree.value) - 1; // -1 protože počítáme bez hlavního BOM
});

// Helper functions
const calculateTotalCost = (node: BOMNode): number => {
  let cost = 0;
  if (node.costPrice && node.quantity) {
    cost = node.costPrice * node.quantity;
  }
  node.children.forEach(child => {
    cost += calculateTotalCost(child);
  });
  return cost;
};

const countBOMItems = (node: BOMNode): number => {
  let count = 1;
  node.children.forEach(child => {
    count += countBOMItems(child);
  });
  return count;
};

const {
  products: autocompleteProducts,
  loading: loadingAutocomplete,
  searchQuery: productSearchQuery,
  loadProductById
} = useProductAutocomplete();

// Při otevření dialogu pro přidání
const openAddDialog = async (node: BOMNode) => {
  parentNode.value = node;
  newComponentData.value = {
    assemblyProductId: productId,
    parentBomId: node.id,
    componentProductId: '',
    quantity: 1
  };
  showAddDialog.value = true;
  
  // Resetuj search query
  productSearchQuery.value = '';
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

/**
 * Načte produkt a jeho BOM
 */
const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Načti produkt
    product.value = await productsService.getById(productId);
    page.value.title = `Kusovník: ${product.value.name}`;

    // Načti BOM
    const bomResponse = await bomService.getBOMTree(productId);
    bomTree.value = bomResponse.data;

    console.log('✅ BOM loaded:', bomTree.value);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání kusovníku';
    console.error('❌ Error loading BOM:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Načte produkty pro výběr
 */
const loadProducts = async () => {
  loadingProducts.value = true;
  try {
    const response = await productsService.getAll(undefined, { maxSize: 200 });
    // Filtrovat produkty - nesmí být stejný jako assemblyProduct
    products.value = response.list.filter(p => p.id !== productId);
  } catch (err) {
    console.error('❌ Error loading products:', err);
  } finally {
    loadingProducts.value = false;
  }
};

/**
 * Vytvoří hlavní BOM
 */
const createMainBOM = async () => {
  if (!product.value) return;

  // Kontrola stockType
  if (product.value.stockType !== 'typZasoby.vyrobek') {
    error.value = 'Kusovník lze vytvořit pouze pro produkty typu "Výrobek"';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await bomService.createMainBOM(productId);
    successMessage.value = 'Hlavní kusovník byl vytvořen';
    await loadData();
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při vytváření kusovníku';
    console.error('❌ Error creating main BOM:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Přidá komponentu do BOM
 */
const addComponent = async () => {
  if (!newComponentData.value.componentProductId) {
    error.value = 'Vyberte produkt';
    return;
  }

  if (newComponentData.value.quantity <= 0) {
    error.value = 'Množství musí být větší než 0';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await bomService.createBOMItem(newComponentData.value);
    successMessage.value = 'Komponenta byla přidána';
    showAddDialog.value = false;
    await loadData();
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při přidávání komponenty';
    console.error('❌ Error adding component:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Otevře dialog pro editaci
 */
const openEditDialog = (node: BOMNode) => {
  editingNode.value = node;
  editComponentData.value = {
    quantity: node.quantity,
    componentProductId: node.componentProductId
  };
  showEditDialog.value = true;
};

/**
 * Uloží změny komponenty
 */
const saveEdit = async () => {
  if (!editingNode.value) return;

  if (editComponentData.value.quantity <= 0) {
    error.value = 'Množství musí být větší než 0';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await bomService.updateBOMItem(editingNode.value.id, {
      quantity: editComponentData.value.quantity
    });
    successMessage.value = 'Komponenta byla aktualizována';
    showEditDialog.value = false;
    await loadData();
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání komponenty';
    console.error('❌ Error updating component:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Smaže komponentu z BOM
 */
const deleteComponent = async (node: BOMNode) => {
  if (!confirm(`Opravdu chcete smazat komponentu "${node.componentProductName}"?`)) {
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await bomService.deleteBOMItem(node.id);
    successMessage.value = 'Komponenta byla smazána';
    await loadData();
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání komponenty';
    console.error('❌ Error deleting component:', err);
  } finally {
    saving.value = false;
  }
};

/**
 * Smaže celý BOM
 */
const deleteMainBOM = async () => {
  if (!confirm('Opravdu chcete smazat celý kusovník? Tato akce je nevratná.')) {
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await bomService.deleteMainBOM(productId);
    successMessage.value = 'Kusovník byl smazán';
    await loadData();
    
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání kusovníku';
    console.error('❌ Error deleting main BOM:', err);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row v-if="loading">
    <v-col cols="12">
      <v-card>
        <v-card-text class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="text-h6 mt-4">Načítání kusovníku...</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row v-else>
    <v-col cols="12">
      <!-- Action buttons -->
      <div class="d-flex justify-space-between align-center mb-4">
        <v-btn variant="text" @click="router.push(`/products/${productId}`)">
          <v-icon start>mdi-arrow-left</v-icon>
          Zpět na produkt
        </v-btn>
        
        <div class="d-flex gap-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            @click="loadData"
            :loading="loading"
            variant="tonal"
          >
            Obnovit
          </v-btn>
          
          <v-btn
            v-if="hasBOM"
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            @click="deleteMainBOM"
            :disabled="saving"
          >
            Smazat kusovník
          </v-btn>
        </div>
      </div>

      <!-- Success message -->
      <v-alert
        v-if="successMessage"
        type="success"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="successMessage = null"
      >
        {{ successMessage }}
      </v-alert>

      <!-- Error message -->
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
        <!-- Main content -->
        <v-col cols="12" md="8">
          <!-- No BOM state -->
          <v-card v-if="!hasBOM" variant="outlined">
            <v-card-text class="text-center py-12">
              <v-icon size="80" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
              <div class="text-h5 mt-4">Kusovník neexistuje</div>
              <div class="text-body-1 text-medium-emphasis mt-2 mb-6">
                Pro tento produkt zatím nebyl vytvořen kusovník.<br>
                Vytvořte hlavní kusovník a poté můžete přidávat komponenty.
              </div>
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-plus"
                @click="createMainBOM"
                :loading="saving"
              >
                Vytvořit kusovník
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- BOM Tree -->
        <UiParentCard v-else title="Struktura kusovníku">
        <BOMTreeNode
            v-if="bomTree"
            :node="bomTree"
            :can-edit="true"
            @add-child="openAddDialog"
            @edit="openEditDialog"
            @delete="deleteComponent"
        />
        </UiParentCard>
        </v-col>

        <!-- Sidebar -->
        <v-col cols="12" md="4">
          <!-- Product info -->
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-4">Informace o produktu</div>
              
              <div class="mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">Název</div>
                <div class="text-body-1 font-weight-medium mt-1">
                  {{ product?.name }}
                </div>
              </div>

              <div class="mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">Kód</div>
                <v-chip color="primary" size="small" class="mt-1">
                  {{ product?.code }}
                </v-chip>
              </div>

              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Typ zásob</div>
                <v-chip 
                  :color="product?.stockType === 'typZasoby.vyrobek' ? 'success' : 'default'" 
                  size="small"
                  class="mt-1"
                >
                  {{ product?.stockType === 'typZasoby.vyrobek' ? 'Výrobek' : product?.stockType }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- BOM Statistics -->
          <v-card variant="outlined" class="mt-4" v-if="hasBOM">
            <v-card-text>
              <div class="text-h6 mb-4">Statistiky kusovníku</div>
              
              <div class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis">Počet položek</div>
                <div class="text-h5 font-weight-bold text-primary mt-1">
                  {{ bomItemsCount }}
                </div>
              </div>

              <v-divider class="my-3"></v-divider>

              <div class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis">Celková hodnota</div>
                <div class="text-h5 font-weight-bold mt-1">
                  {{ formatPrice(totalCost) }}
                </div>
              </div>

              <v-divider class="my-3"></v-divider>

              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Úrovní v hierarchii</div>
                <div class="text-h5 font-weight-bold text-secondary mt-1">
                  {{ bomTree?.level || 0 }}
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Help card -->
          <v-card variant="outlined" class="mt-4">
            <v-card-text>
              <div class="text-h6 mb-4">Nápověda</div>
              
              <div class="text-body-2 text-medium-emphasis">
                <ul class="pl-4">
                  <li class="mb-2">Kusovník popisuje, z jakých komponent se produkt skládá</li>
                  <li class="mb-2">Každá komponenta může mít své vlastní sub-komponenty</li>
                  <li class="mb-2">Použijte menu (⋮) pro přidání, úpravu nebo smazání položek</li>
                  <li>Změny se ukládají okamžitě</li>
                </ul>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <!-- Dialog pro přidání komponenty -->
  <v-dialog v-model="showAddDialog" max-width="600">
    <v-card>
      <v-card-title>Přidat komponentu</v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          Přidávání komponenty pod: <strong>{{ parentNode?.componentProductName }}</strong>
        </v-alert>

        <v-form @submit.prevent="addComponent">
          <v-row>
            <v-col cols="12">
              <!-- **NOVÉ: Autocomplete místo statického selectu** -->
              <v-autocomplete
                v-model="newComponentData.componentProductId"
                v-model:search="productSearchQuery"
                :items="autocompleteProducts"
                item-title="name"
                item-value="id"
                label="Produkt (komponenta) *"
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
                        ? 'Začněte psát pro vyhledání produktů' 
                        : 'Žádné produkty nenalezeny' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model.number="newComponentData.quantity"
                label="Množství *"
                type="number"
                variant="outlined"
                density="comfortable"
                min="0.001"
                step="0.001"
                hint="Kolik kusů této komponenty je potřeba"
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="showAddDialog = false">
          Zrušit
        </v-btn>
        <v-btn 
          color="primary" 
          @click="addComponent"
          :loading="saving"
        >
          Přidat komponentu
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro editaci komponenty -->
  <v-dialog v-model="showEditDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Upravit komponentu</span>
        <v-btn icon variant="text" @click="showEditDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          <div class="text-caption">
            Úprava komponenty: <strong>{{ editingNode?.componentProductName }}</strong>
          </div>
        </v-alert>

        <v-form @submit.prevent="saveEdit">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model.number="editComponentData.quantity"
                label="Množství *"
                type="number"
                variant="outlined"
                density="comfortable"
                min="0.001"
                step="0.001"
                hint="Kolik kusů této komponenty je potřeba"
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="showEditDialog = false">
          Zrušit
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveEdit"
          :loading="saving"
        >
          Uložit změny
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

:deep(.v-card) {
  border-radius: 8px;
}
</style>