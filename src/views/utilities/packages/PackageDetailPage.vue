<!-- src/views/utilities/packages/PackageDetailPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { packagesService } from '@/services/packagesService';
import type { PackageDetail, PackageItem, PackageStatus } from '@/services/packagesService';

const route = useRoute();
const router = useRouter();

const packageId = computed(() => route.params.id as string);

const page = ref({ title: 'Detail balíku' });
const breadcrumbs = ref([
  { title: 'Výroba', disabled: false, href: '#' },
  { title: 'Balíky', disabled: false, href: '/packages' },
  { title: 'Detail', disabled: true, href: '#' }
]);

const packageDetail = ref<PackageDetail | null>(null);
const packageItems = ref<PackageItem[]>([]);
const loading = ref(false);
const loadingItems = ref(false);
const updatingStatus = ref(false);

const packageStatusLabels: Record<PackageStatus, string> = {
  'TO_PACK': 'K zabalení',
  'PACKED': 'Zabaleno',
  'TO_RETURN': 'K vrácení',
  'RETURNED': 'Vráceno',
  'ERROR': 'Chyba'
};

const packageStatusColors: Record<PackageStatus, string> = {
  'TO_PACK': 'primary',
  'PACKED': 'success',
  'TO_RETURN': 'warning',
  'RETURNED': 'info',
  'ERROR': 'error'
};

const customerName = computed(() => {
  if (!packageDetail.value) return '';
  return `${packageDetail.value.shippingAddressFirstName} ${packageDetail.value.shippingAddressLastName}`;
});

const shippingAddress = computed(() => {
  if (!packageDetail.value) return '';
  const parts = [
    packageDetail.value.shippingAddressStreet,
    packageDetail.value.shippingAddressCity,
    packageDetail.value.shippingAddressPostalCode,
    packageDetail.value.shippingAddressCountry
  ].filter(Boolean);
  return parts.join(', ');
});

const formatPrice = (price: number, currency: string = 'CZK') => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency
  }).format(price);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const getCarrierColor = (carrierName: string) => {
  const name = carrierName.toLowerCase();

  // Zásilkovna - červená s bílým textem
  if (name.includes('zásilkovna') || name.includes('zasilkovna')) {
    return { color: 'red-darken-1', variant: 'flat' as const };
  }

  // PPL - modrá s bílým textem
  if (name.includes('ppl')) {
    return { color: 'blue-darken-1', variant: 'flat' as const };
  }

  // Balíkovna - světlejší modrá než PPL
  if (name.includes('balíkovna') || name.includes('balikovna')) {
    return { color: 'light-blue-darken-1', variant: 'flat' as const };
  }

  // Ostatní dopravci - výchozí styl
  return { color: undefined, variant: 'outlined' as const };
};

const getTrackingStatusColor = (status: string) => {
  if (status === 'CREATED') return 'default';
  if (status === 'DELIVERED') return 'success';
  if (status === 'IN_TRANSIT') return 'info';
  if (status === 'ERROR') return 'error';
  return 'primary';
};

const loadPackage = async () => {
  loading.value = true;
  try {
    packageDetail.value = await packagesService.getById(packageId.value);
    loadPackageItems();
  } catch (error) {
    console.error('Chyba při načítání balíku:', error);
  } finally {
    loading.value = false;
  }
};

const loadPackageItems = async () => {
  loadingItems.value = true;
  try {
    packageItems.value = await packagesService.getPackageItems(packageId.value);
  } catch (error) {
    console.error('Chyba při načítání položek balíku:', error);
  } finally {
    loadingItems.value = false;
  }
};

const downloadLabel = () => {
  if (!packageDetail.value?.labelId) return;
  const url = packagesService.getLabelDownloadUrl(packageDetail.value.labelId);
  window.open(url, '_blank');
};

const markPackageAsPacked = async () => {
  if (!packageDetail.value) return;

  if (!confirm('Opravdu chcete balík označit jako zabalený? Dojde tím k vyskladnění produktů ze skladu.')) {
    return;
  }

  updatingStatus.value = true;
  try {
    await packagesService.markPackageAsPacked(packageDetail.value.id);
    await loadPackage();
    alert('Balík byl označen jako zabalený');
  } catch (error) {
    console.error('Chyba při označování balíku jako zabalený:', error);
    alert('Chyba při označování balíku jako zabalený');
  } finally {
    updatingStatus.value = false;
  }
};

const receiveReturn = async () => {
  if (!packageDetail.value) return;

  if (!confirm('Došla vratka zpátky na sklad a obsahuje všechny produkty? Po potvrzení dojde k naskladnění balíku zpět na sklad.')) {
    return;
  }

  updatingStatus.value = true;
  try {
    await packagesService.receiveReturn(packageDetail.value.id);
    await loadPackage();
    alert('Vratka byla úspěšně přijata');
  } catch (error) {
    console.error('Chyba při příjímání vratky:', error);
    alert('Chyba při příjímání vratky');
  } finally {
    updatingStatus.value = false;
  }
};

const sendToExpedition = async () => {
  if (!packageDetail.value) return;

  if (!confirm('Opravdu chcete balík předat do expedice?')) {
    return;
  }

  updatingStatus.value = true;
  try {
    await packagesService.sendToExpedition(packageDetail.value.id);
    await loadPackage();
    alert('Balík byl předán do expedice');
  } catch (error) {
    console.error('Chyba při předávání balíku do expedice:', error);
    alert('Chyba při předávání balíku do expedice');
  } finally {
    updatingStatus.value = false;
  }
};

onMounted(() => {
  loadPackage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <v-row v-if="loading">
    <v-col cols="12">
      <v-skeleton-loader type="article, table"></v-skeleton-loader>
    </v-col>
  </v-row>

  <v-row v-else-if="packageDetail">
    <!-- Akční tlačítka -->
    <v-col cols="12">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <div class="d-flex align-center gap-3">
            <h2 class="text-h4">Balík {{ packageDetail.name }}</h2>
            <v-chip
              :color="getTrackingStatusColor(packageDetail.lastTrackingStatusNormalized)"
              size="default"
              variant="tonal"
            >
              {{ packageDetail.lastTrackingStatusNormalized }}
            </v-chip>
            <v-chip
              v-if="packageDetail.status"
              :color="packageStatusColors[packageDetail.status]"
              size="default"
              variant="tonal"
            >
              {{ packageStatusLabels[packageDetail.status] }}
            </v-chip>
          </div>

          <!-- Chybová zpráva -->
          <v-alert
            v-if="packageDetail.errorMessage"
            type="error"
            variant="tonal"
            class="mt-3"
          >
            {{ packageDetail.errorMessage }}
          </v-alert>
        </div>

        <div class="d-flex gap-2">
          <!-- Tlačítko pro stažení štítku -->
          <v-btn
            v-if="packageDetail.labelId"
            @click="downloadLabel"
            color="primary"
            size="large"
            prepend-icon="mdi-download"
          >
            Stáhnout štítek
          </v-btn>

          <!-- Tlačítka pro TO_PACK stav -->
          <v-btn
            v-if="packageDetail.status === 'TO_PACK'"
            @click="markPackageAsPacked"
            color="success"
            size="large"
            prepend-icon="mdi-package-variant-closed"
            :loading="updatingStatus"
          >
            Označit jako zabalené
          </v-btn>

          <!-- Tlačítka pro TO_RETURN stav -->
          <v-btn
            v-if="packageDetail.status === 'TO_RETURN'"
            @click="receiveReturn"
            color="warning"
            size="large"
            prepend-icon="mdi-package-variant"
            :loading="updatingStatus"
          >
            Příjmout vratku
          </v-btn>

          <!-- Tlačítka pro ERROR stav -->
          <template v-if="packageDetail.status === 'ERROR'">
            <v-btn
              @click="sendToExpedition"
              color="primary"
              size="large"
              prepend-icon="mdi-truck"
              :loading="updatingStatus"
            >
              Předat do expedice
            </v-btn>
            <v-btn
              @click="markPackageAsPacked"
              color="success"
              size="large"
              prepend-icon="mdi-package-variant-closed"
              :loading="updatingStatus"
            >
              Označit jako zabalené
            </v-btn>
          </template>

          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="large"
                v-bind="props"
              ></v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="loadPackage">
                <v-list-item-title>
                  <v-icon size="small" class="mr-2">mdi-refresh</v-icon>
                  Obnovit
                </v-list-item-title>
              </v-list-item>
              <v-list-item :to="`/orders/${packageDetail.salesOrderId}`">
                <v-list-item-title>
                  <v-icon size="small" class="mr-2">mdi-shopping</v-icon>
                  Zobrazit objednávku
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-col>

    <!-- Hlavní info -->
    <v-col cols="12">
      <UiParentCard title="Informace o balíku">
        <v-row>
          <!-- Levý sloupec -->
          <v-col cols="12" md="6">
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Základní informace</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Číslo balíku:</td>
                    <td class="font-weight-bold">{{ packageDetail.name }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Interní číslo:</td>
                    <td>{{ packageDetail.internalNumber }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Objednávka:</td>
                    <td>
                      <router-link :to="`/orders/${packageDetail.salesOrderId}`" class="text-decoration-none">
                        {{ packageDetail.salesOrderName }}
                      </router-link>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Vytvořeno:</td>
                    <td>{{ formatDate(packageDetail.createdAt) }}</td>
                  </tr>
                  <tr v-if="packageDetail.modifiedAt">
                    <td class="text-medium-emphasis font-weight-medium">Upraveno:</td>
                    <td>{{ formatDate(packageDetail.modifiedAt) }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Stav dopravce:</td>
                    <td>
                      <v-chip size="small" :color="getTrackingStatusColor(packageDetail.lastTrackingStatusNormalized)" variant="tonal">
                        {{ packageDetail.lastTrackingStatusNormalized }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr v-if="packageDetail.status">
                    <td class="text-medium-emphasis font-weight-medium">Stav balíku:</td>
                    <td>
                      <v-chip size="small" :color="packageStatusColors[packageDetail.status]" variant="tonal">
                        {{ packageStatusLabels[packageDetail.status] }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Počet kusů:</td>
                    <td>{{ packageDetail.boxCount }}</td>
                  </tr>
                  <tr v-if="packageDetail.packageIssuedFlag !== undefined">
                    <td class="text-medium-emphasis font-weight-medium">Výdejka proběhla:</td>
                    <td>
                      <v-chip size="x-small" :color="packageDetail.packageIssuedFlag ? 'success' : 'default'" variant="flat">
                        {{ packageDetail.packageIssuedFlag ? 'Ano' : 'Ne' }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr v-if="packageDetail.packageReceivedFlag !== undefined">
                    <td class="text-medium-emphasis font-weight-medium">Příjemka vratky proběhla:</td>
                    <td>
                      <v-chip size="x-small" :color="packageDetail.packageReceivedFlag ? 'success' : 'default'" variant="flat">
                        {{ packageDetail.packageReceivedFlag ? 'Ano' : 'Ne' }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Doprava -->
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Doprava</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Dopravce:</td>
                    <td>
                      <v-chip
                        size="small"
                        :color="getCarrierColor(packageDetail.carrierName).color"
                        :variant="getCarrierColor(packageDetail.carrierName).variant"
                      >
                        {{ packageDetail.carrierName }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr v-if="packageDetail.carrierPickupPoint">
                    <td class="text-medium-emphasis font-weight-medium">Výdejní místo:</td>
                    <td>{{ packageDetail.carrierPickupPoint }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Cenové údaje -->
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Cenové údaje</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Hodnota zásilky:</td>
                    <td class="text-end">{{ formatPrice(packageDetail.value, packageDetail.valueCurrency) }}</td>
                  </tr>
                  <tr v-if="packageDetail.codAmount > 0">
                    <td class="text-medium-emphasis font-weight-medium">Dobírka:</td>
                    <td class="text-end font-weight-bold">{{ formatPrice(packageDetail.codAmount, packageDetail.codAmountCurrency) }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Způsob platby:</td>
                    <td class="text-end">{{ packageDetail.paymentMethod }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>

          <!-- Pravý sloupec -->
          <v-col cols="12" md="6">
            <!-- Dodací adresa -->
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Dodací adresa</h4>
              <v-card variant="outlined">
                <v-card-text>
                  <div class="font-weight-medium">{{ customerName }}</div>
                  <div class="text-medium-emphasis">{{ shippingAddress }}</div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Kontakt -->
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Kontakt</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr v-if="packageDetail.email">
                    <td class="text-medium-emphasis font-weight-medium">Email:</td>
                    <td>
                      <a :href="`mailto:${packageDetail.email}`" class="text-decoration-none">
                        {{ packageDetail.email }}
                      </a>
                    </td>
                  </tr>
                  <tr v-if="packageDetail.phoneNumber">
                    <td class="text-medium-emphasis font-weight-medium">Telefon:</td>
                    <td>
                      <a :href="`tel:${packageDetail.phoneNumber}`" class="text-decoration-none">
                        {{ packageDetail.phoneNumber }}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>
        </v-row>
      </UiParentCard>
    </v-col>

    <!-- Položky balíku -->
    <v-col cols="12">
      <UiParentCard title="Položky balíku">
        <template v-slot:action>
          <v-chip color="primary" variant="outlined">
            {{ packageItems.length }} položek
          </v-chip>
        </template>

        <div v-if="loadingItems" class="pa-4">
          <v-skeleton-loader type="table-row@3"></v-skeleton-loader>
        </div>

        <div v-else-if="packageItems.length === 0" class="pa-6 text-center text-medium-emphasis">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-package-variant-closed</v-icon>
          <div>Žádné položky</div>
        </div>

        <v-table v-else density="compact" class="package-items-table">
          <thead>
            <tr>
              <th class="text-left">Produkt</th>
              <th class="text-end">Množství</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in packageItems" :key="item.id">
              <td>
                <div class="font-weight-medium">{{ item.salesOrderItemName }}</div>
                <div v-if="item.productName && item.productName !== item.salesOrderItemName" class="text-caption text-medium-emphasis">
                  {{ item.productName }}
                </div>
              </td>
              <td class="text-end">
                <v-chip size="small" variant="outlined">{{ item.quantity }}</v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.info-table {
  background-color: transparent;
}

.info-table tbody tr td {
  padding: 12px 16px !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.info-table tbody tr td:first-child {
  width: 40%;
}

.info-table tbody tr:last-child td {
  border-bottom: none;
}

.package-items-table {
  background-color: transparent;
}

.package-items-table thead tr th {
  font-weight: 600;
  background-color: rgba(var(--v-theme-primary), 0.05);
  padding: 12px 16px !important;
}

.package-items-table tbody tr td {
  padding: 12px 16px !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.package-items-table tbody tr:last-child td {
  border-bottom: none;
}

.package-items-table tbody tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.02);
}
</style>
