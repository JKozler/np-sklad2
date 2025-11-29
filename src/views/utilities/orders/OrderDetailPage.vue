<!-- src/views/utilities/orders/OrderDetailPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { ordersService } from '@/services/ordersService';
import type { SalesOrder, SalesOrderItem, OrderStatus, StreamEntry, Package, PackageDetail, PackageStatus } from '@/services/ordersService';

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

// Stream/Log data
const streamEntries = ref<StreamEntry[]>([]);
const loadingStream = ref(false);

// Packages data
const packages = ref<Package[]>([]);
const loadingPackages = ref(false);
const selectedPackage = ref<PackageDetail | null>(null);
const packageDetailDialog = ref(false);
const loadingPackageDetail = ref(false);

// Regenerate package
const regeneratingPackage = ref(false);
const regenerateError = ref<string | null>(null);

// Split package
const splitPackageDialog = ref(false);
const loadingSplitPackageData = ref(false);
const splittingPackage = ref(false);
const packageToSplit = ref<PackageDetail | null>(null);
const packageItemsToSplit = ref<any[]>([]);
const selectedItemsToMove = ref<string[]>([]);
const splitOverrides = ref({
  carrierId: '',
  paymentMethod: 'Keep Original',
  codAmount: 0
});

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

    // Načíst stream a balíky paralelně
    loadStream();
    loadPackages();
  } catch (error) {
    console.error('Chyba při načítání objednávky:', error);
  } finally {
    loading.value = false;
  }
};

const loadStream = async () => {
  loadingStream.value = true;
  try {
    const response = await ordersService.getOrderStream(orderId.value);
    streamEntries.value = response.list;
  } catch (error) {
    console.error('Chyba při načítání streamu:', error);
  } finally {
    loadingStream.value = false;
  }
};

const loadPackages = async () => {
  loadingPackages.value = true;
  try {
    const response = await ordersService.getOrderPackages(orderId.value);
    packages.value = response.list;
  } catch (error) {
    console.error('Chyba při načítání balíků:', error);
  } finally {
    loadingPackages.value = false;
  }
};

const openPackageDetail = async (packageId: string) => {
  loadingPackageDetail.value = true;
  packageDetailDialog.value = true;
  try {
    selectedPackage.value = await ordersService.getPackageDetail(packageId);
  } catch (error) {
    console.error('Chyba při načítání detailu balíku:', error);
  } finally {
    loadingPackageDetail.value = false;
  }
};

const downloadLabel = (labelId: string) => {
  const url = ordersService.getLabelDownloadUrl(labelId);
  window.open(url, '_blank');
};

const getStreamActionText = (entry: StreamEntry): string => {
  if (entry.type === 'Create') {
    return 'vytvořil objednávku';
  }
  if (entry.type === 'Update' && entry.data.fields?.includes('status')) {
    const was = entry.data.attributes?.was?.status;
    const became = entry.data.attributes?.became?.status;
    return `upravil stav z "${statusLabels[was] || was}" na "${statusLabels[became] || became}"`;
  }
  if (entry.type === 'Update') {
    return `upravil objednávku (${entry.data.fields?.join(', ')})`;
  }
  return entry.type.toLowerCase();
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
    // Poslat pouze změněné hodnoty
    const changedData: any = {};

    // Porovnat všechny fieldy a přidat pouze změněné
    if (editForm.value.status !== order.value.status) {
      changedData.status = editForm.value.status;
    }
    if (editForm.value.internalNote !== (order.value.internalNote || '')) {
      changedData.internalNote = editForm.value.internalNote;
    }
    if (editForm.value.customerNote !== (order.value.customerNote || '')) {
      changedData.customerNote = editForm.value.customerNote;
    }
    if (editForm.value.assignedUserId !== order.value.assignedUserId) {
      changedData.assignedUserId = editForm.value.assignedUserId;
    }

    // Shipping address
    if (editForm.value.shippingAddressFirstName !== (order.value.shippingAddressFirstName || '')) {
      changedData.shippingAddressFirstName = editForm.value.shippingAddressFirstName;
    }
    if (editForm.value.shippingAddressLastName !== (order.value.shippingAddressLastName || '')) {
      changedData.shippingAddressLastName = editForm.value.shippingAddressLastName;
    }
    if (editForm.value.shippingAddressStreet !== (order.value.shippingAddressStreet || '')) {
      changedData.shippingAddressStreet = editForm.value.shippingAddressStreet;
    }
    if (editForm.value.shippingAddressCity !== (order.value.shippingAddressCity || '')) {
      changedData.shippingAddressCity = editForm.value.shippingAddressCity;
    }
    if (editForm.value.shippingAddressPostalCode !== (order.value.shippingAddressPostalCode || '')) {
      changedData.shippingAddressPostalCode = editForm.value.shippingAddressPostalCode;
    }
    if (editForm.value.shippingAddressCountry !== (order.value.shippingAddressCountry || '')) {
      changedData.shippingAddressCountry = editForm.value.shippingAddressCountry;
    }

    // Billing address
    if (editForm.value.billingAddressFirstName !== (order.value.billingAddressFirstName || '')) {
      changedData.billingAddressFirstName = editForm.value.billingAddressFirstName;
    }
    if (editForm.value.billingAddressLastName !== (order.value.billingAddressLastName || '')) {
      changedData.billingAddressLastName = editForm.value.billingAddressLastName;
    }
    if (editForm.value.billingAddressStreet !== (order.value.billingAddressStreet || '')) {
      changedData.billingAddressStreet = editForm.value.billingAddressStreet;
    }
    if (editForm.value.billingAddressCity !== (order.value.billingAddressCity || '')) {
      changedData.billingAddressCity = editForm.value.billingAddressCity;
    }
    if (editForm.value.billingAddressPostalCode !== (order.value.billingAddressPostalCode || '')) {
      changedData.billingAddressPostalCode = editForm.value.billingAddressPostalCode;
    }
    if (editForm.value.billingAddressCountry !== (order.value.billingAddressCountry || '')) {
      changedData.billingAddressCountry = editForm.value.billingAddressCountry;
    }
    if (editForm.value.billingAddressCompanyName !== (order.value.billingAddressCompanyName || '')) {
      changedData.billingAddressCompanyName = editForm.value.billingAddressCompanyName;
    }

    // Contact
    if (editForm.value.email !== (order.value.email || '')) {
      changedData.email = editForm.value.email;
    }
    if (editForm.value.phoneNumber !== (order.value.phoneNumber || '')) {
      changedData.phoneNumber = editForm.value.phoneNumber;
    }

    // Other
    if (editForm.value.paymentMethod !== (order.value.paymentMethod || '')) {
      changedData.paymentMethod = editForm.value.paymentMethod;
    }
    if (editForm.value.carrierPickupPoint !== (order.value.carrierPickupPoint || '')) {
      changedData.carrierPickupPoint = editForm.value.carrierPickupPoint;
    }

    await ordersService.update(order.value.id, changedData);
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
    // Aktualizace lokálního stavu
    order.value.isStarred = !order.value.isStarred;
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

const applyDiscount = () => {
  if (!order.value) return;

  const url = `https://www.naturalprotein.cz/admin/cs/eshop.orders.orders/export?orderId=${order.value.id}&voucher=ddLkkfg331deffklkekldCmnqo341omkaL00p&apiKey=asdkjne_asdkjkw23ds`;
  window.open(url, '_blank');
};

const regeneratePackage = async () => {
  if (!order.value) return;

  if (!confirm('Opravdu chcete přegenerovat balík pro tuto objednávku?')) {
    return;
  }

  regeneratingPackage.value = true;
  regenerateError.value = null;

  try {
    const response = await ordersService.regeneratePackage(order.value.id);

    // Zkontrolovat, jestli je v odpovědi error
    if (response && response.status === 'error') {
      regenerateError.value = response.message || 'Chyba při regeneraci balíku';
    } else {
      // Úspěch - obnovit data
      await loadOrder();
      alert('Balík byl úspěšně přegenerován');
    }
  } catch (error: any) {
    console.error('Chyba při regeneraci balíku:', error);

    // Pokusit se získat chybovou zprávu z API odpovědi
    if (error.response?.data?.message) {
      regenerateError.value = error.response.data.message;
    } else if (error.message) {
      regenerateError.value = error.message;
    } else {
      regenerateError.value = 'Neznámá chyba při regeneraci balíku';
    }
  } finally {
    regeneratingPackage.value = false;
  }
};

const openSplitPackageDialog = async () => {
  if (!order.value) return;

  splitPackageDialog.value = true;
  loadingSplitPackageData.value = true;
  selectedItemsToMove.value = [];

  try {
    // Načíst balík pro split
    packageToSplit.value = await ordersService.getPackageForSplit(order.value.id);

    // Načíst položky balíku
    packageItemsToSplit.value = await ordersService.getPackageItems(packageToSplit.value.id);
  } catch (error) {
    console.error('Chyba při načítání dat pro split:', error);
    alert('Chyba při načítání dat pro rozdělení balíku');
    splitPackageDialog.value = false;
  } finally {
    loadingSplitPackageData.value = false;
  }
};

const confirmSplitPackage = async () => {
  if (!packageToSplit.value || selectedItemsToMove.value.length === 0) {
    alert('Vyberte alespoň jednu položku k přesunutí');
    return;
  }

  splittingPackage.value = true;

  try {
    // Připravit overrides (pouze pokud je něco vyplněno)
    const overrides: any[] = [];

    await ordersService.splitPackage(
      packageToSplit.value.id,
      selectedItemsToMove.value,
      overrides
    );

    // Úspěch - zavřít dialog a obnovit data
    splitPackageDialog.value = false;
    await loadOrder();
    alert('Balík byl úspěšně rozdělen');
  } catch (error) {
    console.error('Chyba při rozdělování balíku:', error);
    alert('Chyba při rozdělování balíku');
  } finally {
    splittingPackage.value = false;
  }
};

const closeSplitDialog = () => {
  splitPackageDialog.value = false;
  selectedItemsToMove.value = [];
  packageToSplit.value = null;
  packageItemsToSplit.value = [];
  splitOverrides.value = {
    carrierId: '',
    paymentMethod: 'Keep Original',
    codAmount: 0
  };
};

// Package status management
const updatingPackageStatus = ref(false);

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

const markPackageAsPacked = async () => {
  if (!selectedPackage.value) return;

  if (!confirm('Opravdu chcete objednávku označit jako zabalenou? Dojde tím k vyskladnění produktů ze skladu.')) {
    return;
  }

  updatingPackageStatus.value = true;
  try {
    await ordersService.markPackageAsPacked(selectedPackage.value.id);
    await loadPackages();
    // Reload package detail if it's open
    if (packageDetailDialog.value) {
      await openPackageDetail(selectedPackage.value.id);
    }
    alert('Balík byl označen jako zabalený');
  } catch (error) {
    console.error('Chyba při označování balíku jako zabalený:', error);
    alert('Chyba při označování balíku jako zabalený');
  } finally {
    updatingPackageStatus.value = false;
  }
};

const receiveReturn = async () => {
  if (!selectedPackage.value) return;

  if (!confirm('Došla vratka zpátky na sklad a obsahuje všechny produkty? Po potvrzení dojde k naskladnění objednávky zpět na sklad.')) {
    return;
  }

  updatingPackageStatus.value = true;
  try {
    await ordersService.receiveReturn(selectedPackage.value.id);
    await loadPackages();
    // Reload package detail if it's open
    if (packageDetailDialog.value) {
      await openPackageDetail(selectedPackage.value.id);
    }
    alert('Vratka byla úspěšně přijata');
  } catch (error) {
    console.error('Chyba při příjímání vratky:', error);
    alert('Chyba při příjímání vratky');
  } finally {
    updatingPackageStatus.value = false;
  }
};

const sendToExpedition = async () => {
  if (!selectedPackage.value) return;

  if (!confirm('Opravdu chcete balík předat do expedice?')) {
    return;
  }

  updatingPackageStatus.value = true;
  try {
    await ordersService.sendToExpedition(selectedPackage.value.id);
    await loadPackages();
    // Reload package detail if it's open
    if (packageDetailDialog.value) {
      await openPackageDetail(selectedPackage.value.id);
    }
    alert('Balík byl předán do expedice');
  } catch (error) {
    console.error('Chyba při předávání balíku do expedice:', error);
    alert('Chyba při předávání balíku do expedice');
  } finally {
    updatingPackageStatus.value = false;
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
        <div>
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

          <!-- Chybová zpráva z regenerace balíku -->
          <v-alert
            v-if="regenerateError"
            type="error"
            variant="tonal"
            closable
            class="mt-3"
            @click:close="regenerateError = null"
          >
            {{ regenerateError }}
          </v-alert>
        </div>

        <div class="d-flex gap-2">
          <!-- Tlačítko pro přegenerování balíku (pouze pro chybové stavy) -->
          <v-btn
            v-if="order.status === 'expedition-error' || order.status === 'data-error'"
            @click="regeneratePackage"
            color="error"
            size="large"
            prepend-icon="mdi-package-variant"
            :loading="regeneratingPackage"
          >
            Přegenerovat balík
          </v-btn>

          <!-- Tlačítko pro rozdělení balíku (pouze pro in-progress) -->
          <v-btn
            v-if="order.status === 'in-progress'"
            @click="openSplitPackageDialog"
            color="info"
            size="large"
            prepend-icon="mdi-package-variant-closed"
          >
            Rozdělit balík
          </v-btn>

          <v-btn
            @click="applyDiscount"
            color="warning"
            size="large"
            prepend-icon="mdi-ticket-percent"
          >
            Aplikovat 10% slevu
          </v-btn>
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
                  <tr v-if="order.eshopId">
                    <td class="text-medium-emphasis font-weight-medium">Eshop ID:</td>
                    <td>{{ order.eshopId }}</td>
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
                      <v-chip
                        size="small"
                        :color="getCarrierColor(order.carrierName).color"
                        :variant="getCarrierColor(order.carrierName).variant"
                      >
                        {{ order.carrierName }}
                      </v-chip>
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

    <!-- Balíky -->
    <v-col cols="12" md="6">
      <UiParentCard title="Balíky">
        <template v-slot:action>
          <v-chip color="primary" variant="outlined">
            {{ packages.length }} {{ packages.length === 1 ? 'balík' : packages.length < 5 ? 'balíky' : 'balíků' }}
          </v-chip>
        </template>

        <div v-if="loadingPackages" class="pa-4">
          <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
        </div>

        <div v-else-if="packages.length === 0" class="pa-6 text-center text-medium-emphasis">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-package-variant</v-icon>
          <div>Žádné balíky</div>
        </div>

        <v-list v-else lines="two">
          <v-list-item
            v-for="pkg in packages"
            :key="pkg.id"
            @click="openPackageDetail(pkg.id)"
            class="package-item"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-package-variant</v-icon>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ pkg.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              <div class="d-flex align-center gap-2 mt-1">
                <v-chip
                  v-if="pkg.status"
                  size="x-small"
                  :color="packageStatusColors[pkg.status]"
                  variant="tonal"
                >
                  {{ packageStatusLabels[pkg.status] }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="pkg.lastTrackingStatusNormalized === 'CREATED' ? 'default' : 'success'"
                  variant="flat"
                >
                  {{ pkg.lastTrackingStatusNormalized }}
                </v-chip>
                <span class="text-caption">{{ pkg.boxCount }} {{ pkg.boxCount === 1 ? 'kus' : 'kusy' }}</span>
                <span class="text-caption text-medium-emphasis">{{ formatDate(pkg.createdAt) }}</span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </UiParentCard>
    </v-col>

    <!-- Stream/Log -->
    <v-col cols="12" md="6">
      <UiParentCard title="Historie změn">
        <template v-slot:action>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            @click="loadStream"
            :loading="loadingStream"
          ></v-btn>
        </template>

        <div v-if="loadingStream" class="pa-4">
          <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
        </div>

        <div v-else-if="streamEntries.length === 0" class="pa-6 text-center text-medium-emphasis">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-timeline-text-outline</v-icon>
          <div>Žádná historie</div>
        </div>

        <v-timeline v-else align="start" density="compact" side="end">
          <v-timeline-item
            v-for="entry in streamEntries"
            :key="entry.id"
            dot-color="primary"
            size="x-small"
          >
            <template v-slot:opposite>
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(entry.createdAt) }}
              </div>
            </template>

            <div>
              <div class="text-body-2">
                <span class="font-weight-medium">{{ entry.createdByName }}</span>
                <span class="text-medium-emphasis"> {{ getStreamActionText(entry) }}</span>
              </div>
              <div v-if="entry.post" class="text-caption mt-1 text-medium-emphasis">
                {{ entry.post }}
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Package Detail Dialog -->
  <v-dialog v-model="packageDetailDialog" max-width="800px">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Detail balíku {{ selectedPackage?.name }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="packageDetailDialog = false"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text v-if="loadingPackageDetail" class="pa-8">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else-if="selectedPackage" class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Základní informace</h4>
            <v-table density="compact" class="info-table">
              <tbody>
                <tr>
                  <td class="text-medium-emphasis font-weight-medium">Číslo balíku:</td>
                  <td class="font-weight-bold">{{ selectedPackage.name }}</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis font-weight-medium">Interní číslo:</td>
                  <td>{{ selectedPackage.internalNumber }}</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis font-weight-medium">Vytvořeno:</td>
                  <td>{{ formatDate(selectedPackage.createdAt) }}</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis font-weight-medium">Stav dopravce:</td>
                  <td>
                    <v-chip size="small" :color="selectedPackage.lastTrackingStatusNormalized === 'CREATED' ? 'default' : 'success'">
                      {{ selectedPackage.lastTrackingStatusNormalized }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="selectedPackage.status">
                  <td class="text-medium-emphasis font-weight-medium">Stav balíku:</td>
                  <td>
                    <v-chip size="small" :color="packageStatusColors[selectedPackage.status]" variant="tonal">
                      {{ packageStatusLabels[selectedPackage.status] }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="selectedPackage.errorMessage">
                  <td class="text-medium-emphasis font-weight-medium">Chybová zpráva:</td>
                  <td class="text-error">{{ selectedPackage.errorMessage }}</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis font-weight-medium">Počet kusů:</td>
                  <td>{{ selectedPackage.boxCount }}</td>
                </tr>
                <tr v-if="selectedPackage.packageIssuedFlag !== undefined">
                  <td class="text-medium-emphasis font-weight-medium">Výdejka proběhla:</td>
                  <td>
                    <v-chip size="x-small" :color="selectedPackage.packageIssuedFlag ? 'success' : 'default'" variant="flat">
                      {{ selectedPackage.packageIssuedFlag ? 'Ano' : 'Ne' }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="selectedPackage.packageReceivedFlag !== undefined">
                  <td class="text-medium-emphasis font-weight-medium">Příjemka vratky proběhla:</td>
                  <td>
                    <v-chip size="x-small" :color="selectedPackage.packageReceivedFlag ? 'success' : 'default'" variant="flat">
                      {{ selectedPackage.packageReceivedFlag ? 'Ano' : 'Ne' }}
                    </v-chip>
                  </td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis font-weight-medium">Dopravce:</td>
                  <td>
                    <v-chip size="small" variant="outlined">
                      {{ selectedPackage.carrierName }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div class="mt-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Cenové údaje</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Hodnota zásilky:</td>
                    <td class="text-end">{{ formatPrice(selectedPackage.value, selectedPackage.valueCurrency) }}</td>
                  </tr>
                  <tr v-if="selectedPackage.codAmount > 0">
                    <td class="text-medium-emphasis font-weight-medium">Dobírka:</td>
                    <td class="text-end font-weight-bold">{{ formatPrice(selectedPackage.codAmount, selectedPackage.codAmountCurrency) }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Způsob platby:</td>
                    <td class="text-end">{{ selectedPackage.paymentMethod }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <h4 class="text-subtitle-1 font-weight-bold mb-3">Dodací adresa</h4>
            <v-card variant="outlined">
              <v-card-text>
                <div class="font-weight-medium">
                  {{ selectedPackage.shippingAddressFirstName }} {{ selectedPackage.shippingAddressLastName }}
                </div>
                <div class="text-medium-emphasis">{{ selectedPackage.shippingAddressStreet }}</div>
                <div class="text-medium-emphasis">
                  {{ selectedPackage.shippingAddressCity }}, {{ selectedPackage.shippingAddressPostalCode }}
                </div>
                <div class="text-medium-emphasis">{{ selectedPackage.shippingAddressCountry }}</div>
                <div v-if="selectedPackage.carrierPickupPoint" class="mt-2 text-caption">
                  <strong>Výdejní místo:</strong> {{ selectedPackage.carrierPickupPoint }}
                </div>
              </v-card-text>
            </v-card>

            <div class="mt-6">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Kontakt</h4>
              <v-table density="compact" class="info-table">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Email:</td>
                    <td>
                      <a :href="`mailto:${selectedPackage.email}`" class="text-decoration-none">
                        {{ selectedPackage.email }}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis font-weight-medium">Telefon:</td>
                    <td>
                      <a :href="`tel:${selectedPackage.phoneNumber}`" class="text-decoration-none">
                        {{ selectedPackage.phoneNumber }}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
          v-if="selectedPackage?.labelId"
          color="primary"
          size="large"
          prepend-icon="mdi-download"
          @click="downloadLabel(selectedPackage.labelId)"
        >
          Stáhnout štítek
        </v-btn>

        <!-- Tlačítka pro TO_PACK stav -->
        <v-btn
          v-if="selectedPackage?.status === 'TO_PACK'"
          color="success"
          size="large"
          prepend-icon="mdi-package-variant-closed"
          @click="markPackageAsPacked"
          :loading="updatingPackageStatus"
        >
          Označit jako zabalené
        </v-btn>

        <!-- Tlačítka pro TO_RETURN stav -->
        <v-btn
          v-if="selectedPackage?.status === 'TO_RETURN'"
          color="warning"
          size="large"
          prepend-icon="mdi-package-variant"
          @click="receiveReturn"
          :loading="updatingPackageStatus"
        >
          Příjmout vratku
        </v-btn>

        <!-- Tlačítka pro ERROR stav -->
        <template v-if="selectedPackage?.status === 'ERROR'">
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-truck"
            @click="sendToExpedition"
            :loading="updatingPackageStatus"
          >
            Předat do expedice
          </v-btn>
          <v-btn
            color="success"
            size="large"
            prepend-icon="mdi-package-variant-closed"
            @click="markPackageAsPacked"
            :loading="updatingPackageStatus"
            class="ml-2"
          >
            Označit jako zabalené
          </v-btn>
        </template>

        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="packageDetailDialog = false"
          :disabled="updatingPackageStatus"
        >
          Zavřít
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Split Package Dialog -->
  <v-dialog v-model="splitPackageDialog" max-width="900px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between bg-grey-lighten-4">
        <span class="text-h5">Rozdělit balík</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="closeSplitDialog"
          :disabled="splittingPackage"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text v-if="loadingSplitPackageData" class="pa-8">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card-text>

      <v-card-text v-else class="pa-6">
        <!-- Výběr položek k přesunutí -->
        <div class="mb-6">
          <h3 class="text-h6 mb-4">Vyberte položky k přesunutí do nového balíku:</h3>

          <v-card variant="outlined">
            <v-list>
              <v-list-item
                v-for="item in packageItemsToSplit"
                :key="item.id"
                class="border-b"
              >
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="selectedItemsToMove"
                    :value="item.id"
                    hide-details
                  ></v-checkbox>
                </template>

                <v-list-item-title>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="font-weight-medium">
                        {{ item.salesOrderItemName }}
                      </div>
                      <div class="text-caption text-medium-emphasis" v-if="item.productName">
                        {{ item.productName }}
                      </div>
                    </div>
                    <div class="text-right">
                      <v-chip size="small" variant="outlined">
                        Množství: {{ item.quantity }}
                      </v-chip>
                    </div>
                  </div>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>

          <div v-if="packageItemsToSplit.length === 0" class="text-center text-medium-emphasis pa-4">
            Žádné položky k rozdělení
          </div>
        </div>

        <!-- Volitelné přepsání nastavení -->
        <v-divider class="my-6"></v-divider>

        <div>
          <h3 class="text-h6 mb-4">Přepsání nastavení (volitelné):</h3>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="splitOverrides.carrierId"
                label="ID dopravce"
                variant="outlined"
                density="compact"
                hint="Ponechte prázdné pro zachování původního"
                persistent-hint
                placeholder="Ponechte prázdné pro zachování původního"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="splitOverrides.paymentMethod"
                label="Způsob platby"
                variant="outlined"
                density="compact"
                :items="['Keep Original', 'card', 'cash', 'bank_transfer']"
                hint="Ponechte 'Keep Original' pro zachování původního"
                persistent-hint
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="splitOverrides.codAmount"
                label="Částka na dobírku"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                hint="0.00 = žádná dobírka"
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
          variant="outlined"
          @click="closeSplitDialog"
          :disabled="splittingPackage"
        >
          Zrušit
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          size="large"
          @click="confirmSplitPackage"
          :loading="splittingPackage"
          :disabled="selectedItemsToMove.length === 0"
        >
          Rozdělit balík
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

.package-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.package-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.border-b:last-child {
  border-bottom: none;
}
</style>