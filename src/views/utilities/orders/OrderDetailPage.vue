<!-- src/views/utilities/orders/OrderDetailPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { ordersService } from '@/services/ordersService';
import type { SalesOrder, SalesOrderItem, OrderStatus } from '@/services/ordersService';

const route = useRoute();
const router = useRouter();

const orderId = computed(() => route.params.id as string);

const page = ref({ title: 'Detail objednávky' });
const breadcrumbs = ref([
  { title: 'Obchod', disabled: false, href: '#' },
  { title: 'Objednávky', disabled: false, href: '/orders' },
  { title: 'Detail', disabled: true, href: '#' }
]);

const order = ref<SalesOrder | null>(null);
const items = ref<SalesOrderItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const editMode = ref(false);

// Editovatelné fieldy
const editForm = ref({
  status: '' as OrderStatus,
  internalNote: '',
  customerNote: '',
  assignedUserId: null as string | null | undefined,
  // Shipping address
  shippingAddressFirstName: '',
  shippingAddressLastName: '',
  shippingAddressStreet: '',
  shippingAddressCity: '',
  shippingAddressPostalCode: '',
  shippingAddressCountry: '',
  // Billing address
  billingAddressFirstName: '',
  billingAddressLastName: '',
  billingAddressStreet: '',
  billingAddressCity: '',
  billingAddressPostalCode: '',
  billingAddressCountry: '',
  billingAddressCompanyName: '',
  // Contact
  email: '',
  phoneNumber: '',
  // Other
  paymentMethod: '',
  carrierPickupPoint: ''
});

const statusOptions: Array<{ value: OrderStatus; title: string; color: string }> = [
  { value: 'new', title: 'Nová', color: 'default' },
  { value: 'in-progress', title: 'V průběhu', color: 'warning' },
  { value: 'expedition-error', title: 'Expediční problém', color: 'error' },
  { value: 'data-error', title: 'Datový problém', color: 'error' },
  { value: 'sent', title: 'Odesláno', color: 'success' },
  { value: 'return', title: 'Vratka', color: 'info' },
  { value: 'delivered', title: 'Doručeno', color: 'primary' },
  { value: 'cancelled', title: 'Zrušeno', color: 'default' }
];

const statusColors: Record<string, string> = {
  'new': 'default',
  'in-progress': 'warning',
  'expedition-error': 'error',
  'data-error': 'error',
  'sent': 'success',
  'return': 'info',
  'delivered': 'primary',
  'cancelled': 'default'
};

const statusLabels: Record<string, string> = {
  'new': 'Nová',
  'in-progress': 'V průběhu',
  'expedition-error': 'Expediční problém',
  'data-error': 'Datový problém',
  'sent': 'Odesláno',
  'return': 'Vratka',
  'delivered': 'Doručeno',
  'cancelled': 'Zrušeno'
};

const itemHeaders = [
  { title: 'Produkt', key: 'name', sortable: false },
  { title: 'Množství', key: 'quantity', sortable: false, align: 'end' as const },
  { title: 'Jedn. cena', key: 'unitPrice', sortable: false, align: 'end' as const },
  { title: 'DPH %', key: 'vatRate', sortable: false, align: 'center' as const },
  { title: 'Cena bez DPH', key: 'priceWithoutVat', sortable: false, align: 'end' as const },
  { title: 'Cena s DPH', key: 'priceWithVat', sortable: false, align: 'end' as const }
];

const customerName = computed(() => {
  if (!order.value) return '';
  return `${order.value.shippingAddressFirstName} ${order.value.shippingAddressLastName}`;
});

const shippingAddress = computed(() => {
  if (!order.value) return '';
  const parts = [
    order.value.shippingAddressStreet,
    order.value.shippingAddressCity,
    order.value.shippingAddressPostalCode,
    order.value.shippingAddressCountry
  ].filter(Boolean);
  return parts.join(', ');
});

const billingAddress = computed(() => {
  if (!order.value) return '';
  const parts = [
    order.value.billingAddressStreet,
    order.value.billingAddressCity,
    order.value.billingAddressPostalCode,
    order.value.billingAddressCountry
  ].filter(Boolean);
  return parts.join(', ');
});

const totalItems = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity, 0);
});

const formatPrice = (price: number, currency: string = 'CZK') => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadOrder = async () => {
  loading.value = true;
  try {
    order.value = await ordersService.getById(orderId.value);
    items.value = await ordersService.getOrderItems(orderId.value);
    
    // Naplnit editovací formulář
    editForm.value = {
      status: order.value.status,
      internalNote: order.value.internalNote || '',
      customerNote: order.value.customerNote || '',
      assignedUserId: order.value.assignedUserId,
      // Shipping address
      shippingAddressFirstName: order.value.shippingAddressFirstName || '',
      shippingAddressLastName: order.value.shippingAddressLastName || '',
      shippingAddressStreet: order.value.shippingAddressStreet || '',
      shippingAddressCity: order.value.shippingAddressCity || '',
      shippingAddressPostalCode: order.value.shippingAddressPostalCode || '',
      shippingAddressCountry: order.value.shippingAddressCountry || '',
      // Billing address
      billingAddressFirstName: order.value.billingAddressFirstName || '',
      billingAddressLastName: order.value.billingAddressLastName || '',
      billingAddressStreet: order.value.billingAddressStreet || '',
      billingAddressCity: order.value.billingAddressCity || '',
      billingAddressPostalCode: order.value.billingAddressPostalCode || '',
      billingAddressCountry: order.value.billingAddressCountry || '',
      billingAddressCompanyName: order.value.billingAddressCompanyName || '',
      // Contact
      email: order.value.email || '',
      phoneNumber: order.value.phoneNumber || '',
      // Other
      paymentMethod: order.value.paymentMethod || '',
      carrierPickupPoint: order.value.carrierPickupPoint || ''
    };
  } catch (error) {
    console.error('Chyba při načítání objednávky:', error);
  } finally {
    loading.value = false;
  }
};

const toggleEdit = () => {
  if (editMode.value) {
    // Reset form při zrušení editace
    if (order.value) {
      editForm.value = {
        status: order.value.status,
        internalNote: order.value.internalNote || '',
        customerNote: order.value.customerNote || '',
        assignedUserId: order.value.assignedUserId,
        // Shipping address
        shippingAddressFirstName: order.value.shippingAddressFirstName || '',
        shippingAddressLastName: order.value.shippingAddressLastName || '',
        shippingAddressStreet: order.value.shippingAddressStreet || '',
        shippingAddressCity: order.value.shippingAddressCity || '',
        shippingAddressPostalCode: order.value.shippingAddressPostalCode || '',
        shippingAddressCountry: order.value.shippingAddressCountry || '',
        // Billing address
        billingAddressFirstName: order.value.billingAddressFirstName || '',
        billingAddressLastName: order.value.billingAddressLastName || '',
        billingAddressStreet: order.value.billingAddressStreet || '',
        billingAddressCity: order.value.billingAddressCity || '',
        billingAddressPostalCode: order.value.billingAddressPostalCode || '',
        billingAddressCountry: order.value.billingAddressCountry || '',
        billingAddressCompanyName: order.value.billingAddressCompanyName || '',
        // Contact
        email: order.value.email || '',
        phoneNumber: order.value.phoneNumber || '',
        // Other
        paymentMethod: order.value.paymentMethod || '',
        carrierPickupPoint: order.value.carrierPickupPoint || ''
      };
    }
  }
  editMode.value = !editMode.value;
};

const saveChanges = async () => {
  if (!order.value) return;
  
  saving.value = true;
  try {
    await ordersService.update(order.value.id, editForm.value);
    await loadOrder();
    editMode.value = false;
  } catch (error) {
    console.error('Chyba při ukládání:', error);
    alert('Chyba při ukládání změn');
  } finally {
    saving.value = false;
  }
};

const toggleStar = async () => {
  if (!order.value) return;
  
  try {
    await ordersService.toggleStar(order.value.id, !order.value.isStarred);
    await loadOrder();
  } catch (error) {
    console.error('Chyba při označování hvězdičkou:', error);
  }
};

const deleteOrder = async () => {
  if (!order.value) return;
  
  if (confirm(`Opravdu chcete smazat objednávku ${order.value.name}?`)) {
    try {
      await ordersService.delete(order.value.id);
      router.push('/orders');
    } catch (error) {
      console.error('Chyba při mazání objednávky:', error);
      alert('Chyba při mazání objednávky');
    }
  }
};

onMounted(() => {
  loadOrder();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row v-if="loading">
    <v-col cols="12">
      <v-skeleton-loader type="article, table"></v-skeleton-loader>
    </v-col>
  </v-row>

  <v-row v-else-if="order">
    <!-- Akční tlačítka -->
    <v-col cols="12">
      <div class="d-flex justify-space-between align-center mb-4">
        <div class="d-flex align-center gap-3">
          <v-btn
            icon
            size="default"
            variant="text"
            @click="toggleStar"
          >
            <v-icon :color="order.isStarred ? 'warning' : 'grey-lighten-1'">
              {{ order.isStarred ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </v-btn>
          <h2 class="text-h4">Objednávka {{ order.name }}</h2>
          <v-chip 
            :color="statusColors[order.status]" 
            size="default"
            variant="tonal"
          >
            {{ statusLabels[order.status] }}
          </v-chip>
        </div>

        <div class="d-flex gap-2">
          <v-btn
            v-if="!editMode"
            @click="toggleEdit"
            color="primary"
            size="large"
            prepend-icon="mdi-pencil"
          >
            Upravit objednávku
          </v-btn>
          <template v-else>
            <v-btn
              @click="saveChanges"
              color="success"
              size="large"
              prepend-icon="mdi-content-save"
              :loading="saving"
            >
              Uložit změny
            </v-btn>
            <v-btn
              @click="toggleEdit"
              color="error"
              size="large"
              variant="outlined"
              :disabled="saving"
            >
              Zrušit
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
              <v-list-item @click="loadOrder">
                <v-list-item-title>
                  <v-icon size="small" class="mr-2">mdi-refresh</v-icon>
                  Obnovit
                </v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="deleteOrder" class="text-error">
                <v-list-item-title>
                  <v-icon size="small" class="mr-2">mdi-delete</v-icon>
                  Smazat
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-col>

    <!-- Hlavní info -->
    <v-col cols="12">
      <UiParentCard title="Informace o objednávce">

        <!-- Základní informace -->
        <v-row>
          <!-- Levý sloupec -->
          <v-col cols="12" md="6">
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Základní informace</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Číslo objednávky:</td>
                    <td class="font-weight-bold">{{ order.name }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Datum vytvoření:</td>
                    <td>{{ formatDate(order.createdAt) }}</td>
                  </tr>
                  <tr v-if="order.modifiedAt">
                    <td class="text-medium-emphasis font-weight-medium">Poslední změna:</td>
                    <td>{{ formatDate(order.modifiedAt) }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Status:</td>
                    <td>
                      <v-select
                        v-if="editMode"
                        v-model="editForm.status"
                        :items="statusOptions"
                        density="compact"
                        variant="outlined"
                        hide-details
                      >
                        <template v-slot:item="{ props, item }">
                          <v-list-item v-bind="props">
                            <template v-slot:prepend>
                              <v-chip 
                                :color="item.raw.color" 
                                size="x-small"
                                class="mr-2"
                              ></v-chip>
                            </template>
                          </v-list-item>
                        </template>
                      </v-select>
                      <v-chip 
                        v-else
                        :color="statusColors[order.status]" 
                        size="small"
                        variant="tonal"
                      >
                        {{ statusLabels[order.status] }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Kanál:</td>
                    <td>
                      <v-chip size="small" variant="outlined">{{ order.channel }}</v-chip>
                    </td>
                  </tr>
                  <tr v-if="order.paymentMethod">
                    <td class="text-medium-emphasis font-weight-medium">Způsob platby:</td>
                    <td>{{ order.paymentMethod }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Doprava -->
            <div class="mb-6" v-if="order.carrierName">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Doprava</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Dopravce:</td>
                    <td>
                      <v-chip size="small" variant="outlined">{{ order.carrierName }}</v-chip>
                    </td>
                  </tr>
                  <tr v-if="order.carrierPickupPoint">
                    <td class="text-medium-emphasis font-weight-medium">Výdejní místo:</td>
                    <td>{{ order.carrierPickupPoint }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>

          <!-- Pravý sloupec -->
          <v-col cols="12" md="6">
            <!-- Zákazník -->
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Zákazník</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Jméno:</td>
                    <td class="font-weight-bold">
                      <div v-if="!editMode">{{ customerName }}</div>
                      <div v-else class="d-flex gap-2">
                        <v-text-field
                          v-model="editForm.shippingAddressFirstName"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="Jméno"
                        ></v-text-field>
                        <v-text-field
                          v-model="editForm.shippingAddressLastName"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="Příjmení"
                        ></v-text-field>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="order.email || editMode">
                    <td class="text-medium-emphasis font-weight-medium">Email:</td>
                    <td>
                      <a v-if="!editMode && order.email" :href="`mailto:${order.email}`" class="text-decoration-none">
                        {{ order.email }}
                      </a>
                      <v-text-field
                        v-else
                        v-model="editForm.email"
                        type="email"
                        density="compact"
                        variant="outlined"
                        hide-details
                        placeholder="email@example.com"
                      ></v-text-field>
                    </td>
                  </tr>
                  <tr v-if="order.phoneNumber || editMode">
                    <td class="text-medium-emphasis font-weight-medium">Telefon:</td>
                    <td>
                      <a v-if="!editMode && order.phoneNumber" :href="`tel:${order.phoneNumber}`" class="text-decoration-none">
                        {{ order.phoneNumber }}
                      </a>
                      <v-text-field
                        v-else
                        v-model="editForm.phoneNumber"
                        type="tel"
                        density="compact"
                        variant="outlined"
                        hide-details
                        placeholder="+420..."
                      ></v-text-field>
                    </td>
                  </tr>
                  <tr v-if="order.billingAddressCompanyName || editMode">
                    <td class="text-medium-emphasis font-weight-medium">Firma:</td>
                    <td>
                      <span v-if="!editMode">{{ order.billingAddressCompanyName }}</span>
                      <v-text-field
                        v-else
                        v-model="editForm.billingAddressCompanyName"
                        density="compact"
                        variant="outlined"
                        hide-details
                        placeholder="Název firmy"
                      ></v-text-field>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Ceny -->
            <div class="mb-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Cenové údaje</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr v-if="order.priceWithoutVat">
                    <td class="text-medium-emphasis font-weight-medium">Cena bez DPH:</td>
                    <td class="text-end">{{ formatPrice(order.priceWithoutVat, order.currency) }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Cena s DPH:</td>
                    <td class="text-end font-weight-bold text-h6">
                      {{ formatPrice(order.priceWithVat, order.currency) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Měna:</td>
                    <td class="text-end">{{ order.currency }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>
        </v-row>

        <!-- Adresy -->
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Dodací adresa</h4>
            <v-card variant="outlined" v-if="!editMode">
              <v-card-text>
                <div class="font-weight-medium">{{ customerName }}</div>
                <div class="text-medium-emphasis">{{ shippingAddress }}</div>
              </v-card-text>
            </v-card>
            <v-card variant="outlined" v-else>
              <v-card-text class="d-flex flex-column gap-3">
                <v-text-field
                  v-model="editForm.shippingAddressStreet"
                  label="Ulice"
                  density="compact"
                  variant="outlined"
                  hide-details
                ></v-text-field>
                <div class="d-flex gap-2">
                  <v-text-field
                    v-model="editForm.shippingAddressCity"
                    label="Město"
                    density="compact"
                    variant="outlined"
                    hide-details
                  ></v-text-field>
                  <v-text-field
                    v-model="editForm.shippingAddressPostalCode"
                    label="PSČ"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 150px"
                  ></v-text-field>
                </div>
                <v-text-field
                  v-model="editForm.shippingAddressCountry"
                  label="Země"
                  density="compact"
                  variant="outlined"
                  hide-details
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Fakturační adresa</h4>
            <v-card variant="outlined" v-if="!editMode">
              <v-card-text>
                <div class="font-weight-medium" v-if="order.billingAddressCompanyName">
                  {{ order.billingAddressCompanyName }}
                </div>
                <div :class="{ 'font-weight-medium': !order.billingAddressCompanyName }">
                  {{ order.billingAddressFirstName }} {{ order.billingAddressLastName }}
                </div>
                <div class="text-medium-emphasis">{{ billingAddress }}</div>
              </v-card-text>
            </v-card>
            <v-card variant="outlined" v-else>
              <v-card-text class="d-flex flex-column gap-3">
                <div class="d-flex gap-2">
                  <v-text-field
                    v-model="editForm.billingAddressFirstName"
                    label="Jméno"
                    density="compact"
                    variant="outlined"
                    hide-details
                  ></v-text-field>
                  <v-text-field
                    v-model="editForm.billingAddressLastName"
                    label="Příjmení"
                    density="compact"
                    variant="outlined"
                    hide-details
                  ></v-text-field>
                </div>
                <v-text-field
                  v-model="editForm.billingAddressStreet"
                  label="Ulice"
                  density="compact"
                  variant="outlined"
                  hide-details
                ></v-text-field>
                <div class="d-flex gap-2">
                  <v-text-field
                    v-model="editForm.billingAddressCity"
                    label="Město"
                    density="compact"
                    variant="outlined"
                    hide-details
                  ></v-text-field>
                  <v-text-field
                    v-model="editForm.billingAddressPostalCode"
                    label="PSČ"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 150px"
                  ></v-text-field>
                </div>
                <v-text-field
                  v-model="editForm.billingAddressCountry"
                  label="Země"
                  density="compact"
                  variant="outlined"
                  hide-details
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Poznámky -->
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Interní poznámka</h4>
            <v-textarea
              v-if="editMode"
              v-model="editForm.internalNote"
              variant="outlined"
              rows="3"
              hide-details
            ></v-textarea>
            <v-card v-else variant="outlined">
              <v-card-text>
                <div v-if="order.internalNote" class="text-body-2">{{ order.internalNote }}</div>
                <div v-else class="text-medium-emphasis text-body-2">Žádná interní poznámka</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Poznámka zákazníka</h4>
            <v-textarea
              v-if="editMode"
              v-model="editForm.customerNote"
              variant="outlined"
              rows="3"
              hide-details
            ></v-textarea>
            <v-card v-else variant="outlined">
              <v-card-text>
                <div v-if="order.customerNote" class="text-body-2">{{ order.customerNote }}</div>
                <div v-else class="text-medium-emphasis text-body-2">Žádná poznámka od zákazníka</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </UiParentCard>
    </v-col>

    <!-- Položky objednávky -->
    <v-col cols="12">
      <UiParentCard title="Položky objednávky">
        <template v-slot:action>
          <v-chip color="primary" variant="outlined">
            Celkem {{ totalItems }} položek
          </v-chip>
        </template>

        <v-data-table
          :headers="itemHeaders"
          :items="items"
          :items-per-page="-1"
          hide-default-footer
          class="elevation-0"
        >
          <template v-slot:item.name="{ item }">
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div 
                v-if="item.productName && item.productName !== item.name" 
                class="text-caption text-medium-emphasis"
              >
                {{ item.productName }}
              </div>
            </div>
          </template>

          <template v-slot:item.quantity="{ item }">
            <span class="font-weight-medium">{{ item.quantity }}</span>
          </template>

          <template v-slot:item.unitPrice="{ item }">
            {{ item.unitPrice > 0 ? formatPrice(item.unitPrice, order.currency) : '—' }}
          </template>

          <template v-slot:item.vatRate="{ item }">
            <v-chip size="x-small" variant="outlined">{{ item.vatRate }}%</v-chip>
          </template>

          <template v-slot:item.priceWithoutVat="{ item }">
            {{ item.priceWithoutVat > 0 ? formatPrice(item.priceWithoutVat, order.currency) : '—' }}
          </template>

          <template v-slot:item.priceWithVat="{ item }">
            <span class="font-weight-medium">
              {{ item.priceWithVat > 0 ? formatPrice(item.priceWithVat, order.currency) : '—' }}
            </span>
          </template>

          <template v-slot:bottom>
            <div class="pa-4 border-t">
              <v-row>
                <v-col cols="12" class="text-end">
                  <div class="d-flex justify-end align-center gap-4">
                    <span class="text-subtitle-1 font-weight-medium">Celková cena bez DPH:</span>
                    <span class="text-h6" v-if="order.priceWithoutVat">
                      {{ formatPrice(order.priceWithoutVat, order.currency) }}
                    </span>
                  </div>
                  <div class="d-flex justify-end align-center gap-4 mt-2">
                    <span class="text-subtitle-1 font-weight-medium">Celková cena s DPH:</span>
                    <span class="text-h5 font-weight-bold primary--text">
                      {{ formatPrice(order.priceWithVat, order.currency) }}
                    </span>
                  </div>
                </v-col>
              </v-row>
            </div>
          </template>
        </v-data-table>
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

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>