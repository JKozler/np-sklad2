<!-- src/views/utilities/suppliers/SuppliersPage.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { accountService } from '@/services/accountService';
import type { AccountListItem, CreateAccountData, Account } from '@/services/accountService';

const router = useRouter();

const page = ref({ title: 'Dodavatelé' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Dodavatelé', disabled: true, href: '#' }
]);

const suppliers = ref<AccountListItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const search = ref('');
const showDialog = ref(false);
const editingSupplier = ref<Account | null>(null);
const saving = ref(false);
const totalSuppliers = ref(0);

// Formulářová data
const formData = ref<CreateAccountData>({
  name: '',
  type: 'SUPPLIER',
  website: '',
  emailAddress: '',
  phoneNumber: '',
  billingAddressStreet: '',
  billingAddressCity: '',
  billingAddressState: '',
  billingAddressCountry: '',
  billingAddressPostalCode: '',
  description: '',
  vatId: ''
});

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Web', key: 'website', sortable: true },
  { title: 'Země', key: 'billingAddressCountry', sortable: true },
  { title: 'Vytvořeno', key: 'createdAt', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const loadSuppliers = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await accountService.getSuppliers({
      maxSize: 100,
      offset: 0,
      orderBy: 'createdAt',
      order: 'desc',
      searchText: search.value
    });
    suppliers.value = response.list;
    totalSuppliers.value = response.total;
    console.log('✅ Načteno dodavatelů:', suppliers.value.length);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání dodavatelů';
    console.error('Chyba při načítání dodavatelů:', err);
  } finally {
    loading.value = false;
  }
};

// Sledování změn vyhledávacího pole s debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadSuppliers();
  }, 300);
});

const openCreateDialog = () => {
  editingSupplier.value = null;
  formData.value = {
    name: '',
    type: 'SUPPLIER',
    website: '',
    emailAddress: '',
    phoneNumber: '',
    billingAddressStreet: '',
    billingAddressCity: '',
    billingAddressState: '',
    billingAddressCountry: '',
    billingAddressPostalCode: '',
    description: '',
    vatId: ''
  };
  showDialog.value = true;
};

const openEditDialog = async (supplier: AccountListItem) => {
  try {
    // Načti plný detail dodavatele
    const fullSupplier = await accountService.getById(supplier.id);
    editingSupplier.value = fullSupplier;
    formData.value = {
      name: fullSupplier.name,
      type: 'SUPPLIER',
      website: fullSupplier.website || '',
      emailAddress: fullSupplier.emailAddress || '',
      phoneNumber: fullSupplier.phoneNumber || '',
      billingAddressStreet: fullSupplier.billingAddressStreet || '',
      billingAddressCity: fullSupplier.billingAddressCity || '',
      billingAddressState: fullSupplier.billingAddressState || '',
      billingAddressCountry: fullSupplier.billingAddressCountry || '',
      billingAddressPostalCode: fullSupplier.billingAddressPostalCode || '',
      description: fullSupplier.description || '',
      vatId: fullSupplier.vatId || ''
    };
    showDialog.value = true;
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání detailu dodavatele';
    console.error('Chyba při načítání detailu:', err);
  }
};

const saveSupplier = async () => {
  if (!formData.value.name) {
    error.value = 'Název dodavatele je povinný';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    if (editingSupplier.value) {
      await accountService.update(editingSupplier.value.id, formData.value);
    } else {
      await accountService.create(formData.value);
    }

    showDialog.value = false;
    await loadSuppliers();
  } catch (err: any) {
    error.value = err.message || 'Chyba při ukládání dodavatele';
    console.error('Chyba při ukládání:', err);
  } finally {
    saving.value = false;
  }
};

const deleteSupplier = async (supplier: AccountListItem) => {
  if (!confirm(`Opravdu chcete smazat dodavatele "${supplier.name}"?`)) {
    return;
  }

  try {
    await accountService.delete(supplier.id);
    await loadSuppliers();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání dodavatele';
    console.error('Chyba při mazání:', err);
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
};

const formatWebsiteUrl = (url: string | null): string | null => {
  if (!url) return null;
  // Pokud URL již obsahuje protokol, vrať ji tak jak je
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Jinak přidej https://
  return `https://${url}`;
};

const getCountryFlag = (countryCode: string | null): string => {
  if (!countryCode) return '🏳️';
  const flags: Record<string, string> = {
    'CZ': '🇨🇿',
    'SK': '🇸🇰',
    'HU': '🇭🇺',
    'PL': '🇵🇱',
    'DE': '🇩🇪',
    'AT': '🇦🇹'
  };
  return flags[countryCode] || '🏳️';
};

onMounted(() => {
  loadSuppliers();
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
              <div class="text-subtitle-2 text-medium-emphasis">Celkem dodavatelů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ totalSuppliers }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Aktuálně zobrazeno</div>
              <div class="text-h4 font-weight-bold mt-2 text-primary">
                {{ suppliers.length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam dodavatelů">
        <!-- Toolbar -->
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Hledat dodavatele"
            single-line
            hide-details
            variant="outlined"
            density="compact"
            style="max-width: 400px"
            clearable
          ></v-text-field>

          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="loadSuppliers"
              :loading="loading"
            >
              Obnovit
            </v-btn>
            <v-btn
              color="success"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Nový dodavatel
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
          :items="suppliers"
          :loading="loading"
          :items-per-page="100"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar color="primary" size="32" class="mr-3">
                <v-icon color="white">mdi-domain</v-icon>
              </v-avatar>
              <span class="font-weight-medium">{{ item.name }}</span>
            </div>
          </template>

          <template v-slot:item.website="{ item }">
            <a
              v-if="item.website"
              :href="formatWebsiteUrl(item.website)"
              target="_blank"
              class="text-primary text-decoration-none"
            >
              <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
              {{ item.website }}
            </a>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.billingAddressCountry="{ item }">
            <div v-if="item.billingAddressCountry">
              {{ getCountryFlag(item.billingAddressCountry) }}
              {{ item.billingAddressCountry }}
            </div>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
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
                    @click="deleteSupplier(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-domain</v-icon>
              <div class="text-h6 mt-4">Žádní dodavatelé</div>
              <div class="text-caption text-medium-emphasis">
                Přidejte dodavatele kliknutím na tlačítko "Nový dodavatel"
              </div>
            </div>
          </template>
        </v-data-table>

        <!-- Info -->
        <div class="mt-4 text-caption text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
          Celkem dodavatelů: <strong>{{ totalSuppliers }}</strong>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Dialog pro vytvoření/úpravu dodavatele -->
  <v-dialog v-model="showDialog" max-width="900">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ editingSupplier ? 'Upravit dodavatele' : 'Nový dodavatel' }}</span>
        <v-btn icon variant="text" @click="showDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-form>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="Název dodavatele *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-domain"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.website"
                label="Webová stránka"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-web"
                placeholder="https://example.com"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.emailAddress"
                label="Email"
                type="email"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-email"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.phoneNumber"
                label="Telefon"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-phone"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.vatId"
                label="IČO/DIČ"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-identifier"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-2 mb-2">Fakturační adresa</div>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.billingAddressStreet"
                label="Ulice a č.p."
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-home"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.billingAddressCity"
                label="Město"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-city"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.billingAddressPostalCode"
                label="PSČ"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-mailbox"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.billingAddressCountry"
                label="Země (kód)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-flag"
                placeholder="CZ"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Poznámka"
                variant="outlined"
                density="comfortable"
                rows="3"
                prepend-inner-icon="mdi-note-text"
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
          @click="saveSupplier"
          :loading="saving"
        >
          {{ editingSupplier ? 'Uložit' : 'Vytvořit' }}
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
</style>
