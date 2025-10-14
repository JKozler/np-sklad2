<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productsService } from '@/services/productsService';
import type { CreateProductData } from '@/services/productsService';

const router = useRouter();

const page = ref({ title: 'Nový produkt' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Produkty', disabled: false, href: '/products' },
  { title: 'Nový produkt', disabled: true, href: '#' }
]);

const saving = ref(false);
const error = ref<string | null>(null);
const productGroups = ref<string[]>([]);
const uoms = ref<Array<{ id: string; name: string }>>([]);
const loadingUoms = ref(false);

// Formulářová data
const formData = ref<CreateProductData>({
  name: '',
  code: '',
  description: null,
  ean: '',
  priceWithoutVat: null,
  priceWithVat: null,
  price: null,
  stockType: 'typZasoby.zbozi',
  isStockItem: false,
  vatRate: 'typSzbDph.dphZakl',
  priceType: 'typCeny.sDph',
  productGroupId: null,
  uomId: ''  // <-- ZMĚNA: prázdný string místo null
});

const formValid = ref(false);

const rules = {
  required: (v: string) => !!v || 'Toto pole je povinné',
  requiredCode: (v: string) => !!v || 'Kód je povinný',
  requiredUom: (v: string) => !!v || 'Měrná jednotka je povinná'  // <-- NOVÉ
};

const loadData = async () => {
  loadingUoms.value = true;
  try {
    productGroups.value = await productsService.getProductGroups();
    uoms.value = await productsService.getUOMs();
    
    // Automaticky vyber první UOM pokud existuje
    if (uoms.value.length > 0 && !formData.value.uomId) {
      formData.value.uomId = uoms.value[0].id;
    }
  } catch (err) {
    console.error('Chyba při načítání dat:', err);
    error.value = 'Chyba při načítání měrných jednotek';
  } finally {
    loadingUoms.value = false;
  }
};

const createProduct = async () => {
  if (!formValid.value) {
    error.value = 'Vyplňte prosím všechna povinná pole';
    return;
  }
  
  saving.value = true;
  error.value = null;
  
  try {
    const created = await productsService.create(formData.value);
    router.push(`/products/${created.id}`);
  } catch (err: any) {
    error.value = err.message || 'Chyba při vytváření produktu';
    console.error('Chyba při vytváření:', err);
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  if (confirm('Opravdu chcete zrušit vytváření produktu? Všechny změny budou ztraceny.')) {
    router.push('/products');
  }
};

onMounted(() => {
  loadData();
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
            @click="createProduct"
            :loading="saving"
            :disabled="!formValid || loadingUoms"
          >
            Vytvořit produkt
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
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.name"
                    label="Název produktu *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-package-variant"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.code"
                    label="Kód *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-barcode"
                    :rules="[rules.requiredCode]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="formData.description"
                    label="Popis"
                    variant="outlined"
                    rows="3"
                    prepend-inner-icon="mdi-text"
                  ></v-textarea>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.ean"
                    label="EAN"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-barcode-scan"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.uomId"
                    :items="uoms"
                    item-title="name"
                    item-value="id"
                    label="Měrná jednotka *"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-ruler"
                    :rules="[rules.requiredUom]"
                    :loading="loadingUoms"
                  >
                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>Žádné měrné jednotky</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
              </v-row>
            </UiParentCard>

            <UiParentCard title="Cenové informace" class="mt-4">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.priceWithoutVat"
                    label="Cena bez DPH"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    suffix="Kč"
                    prepend-inner-icon="mdi-currency-usd"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.priceWithVat"
                    label="Cena s DPH"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    suffix="Kč"
                    prepend-inner-icon="mdi-currency-usd"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="formData.price"
                    label="Základní cena"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    suffix="Kč"
                    prepend-inner-icon="mdi-currency-usd"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.vatRate"
                    :items="[
                      { title: 'DPH Základní (21%)', value: 'typSzbDph.dphZakl' },
                      { title: 'DPH Snížená (12%)', value: 'typSzbDph.dphSniz' },
                      { title: 'Bez DPH', value: 'typSzbDph.bezDph' }
                    ]"
                    label="Sazba DPH"
                    variant="outlined"
                    density="comfortable"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.priceType"
                    :items="[
                      { title: 'S DPH', value: 'typCeny.sDph' },
                      { title: 'Bez DPH', value: 'typCeny.bezDph' }
                    ]"
                    label="Typ ceny"
                    variant="outlined"
                    density="comfortable"
                  ></v-select>
                </v-col>
              </v-row>
            </UiParentCard>

            <UiParentCard title="Skladové informace" class="mt-4">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.stockType"
                    :items="[
                      { title: 'Zboží', value: 'typZasoby.zbozi' },
                      { title: 'Materiál', value: 'typZasoby.material' }
                    ]"
                    label="Typ zásob"
                    variant="outlined"
                    density="comfortable"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-switch
                    v-model="formData.isStockItem"
                    label="Skladová položka"
                    color="success"
                    hide-details
                    inset
                  ></v-switch>
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="formData.productGroupId"
                    :items="[
                      { title: '-- Žádná skupina --', value: null },
                      ...productGroups.map(g => ({ title: g, value: g }))
                    ]"
                    label="Skupina produktů"
                    variant="outlined"
                    density="comfortable"
                    clearable
                  ></v-select>
                </v-col>
              </v-row>
            </UiParentCard>
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

              <div class="text-subtitle-2 mb-2">Povinné údaje:</div>
              <ul class="text-body-2 text-medium-emphasis">
                <li>Název produktu</li>
                <li>Kód produktu</li>
                <li>Měrná jednotka</li>
              </ul>

              <v-divider class="my-3"></v-divider>

              <div class="text-subtitle-2 mb-2">Dostupné měrné jednotky:</div>
              <v-chip-group column>
                <v-chip 
                  v-for="uom in uoms" 
                  :key="uom.id"
                  size="small"
                  :color="formData.uomId === uom.id ? 'primary' : 'default'"
                >
                  {{ uom.name }}
                </v-chip>
              </v-chip-group>

              <v-divider class="my-3"></v-divider>

              <div class="text-subtitle-2 mb-2">Tipy:</div>
              <ul class="text-body-2 text-medium-emphasis">
                <li>EAN kód slouží pro identifikaci pomocí čárového kódu</li>
                <li>Ceny můžete vyplnit později</li>
                <li>Typ zásob určuje, jak se produkt zobrazí v skladových přehledech</li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>