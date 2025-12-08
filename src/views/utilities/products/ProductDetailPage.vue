<!-- src/views/utilities/products/ProductDetailPage.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productsService } from '@/services/productsService';
import type { Product, UpdateProductData, CreateProductData } from '@/services/productsService';
import { inventoryCardService } from '@/services/inventoryCardService';
import type { InventoryCard } from '@/services/inventoryCardService';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import type { InventoryTransaction } from '@/services/inventoryTransactionService';
import { accountService } from '@/services/accountService';
import type { AccountListItem } from '@/services/accountService';

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

// Skladové karty
const inventoryCards = ref<InventoryCard[]>([]);
const loadingInventoryCards = ref(false);
const inventoryCardsError = ref<string | null>(null);

// **NOVÉ: Duplikace a export**
const duplicating = ref(false);
const exporting = ref(false);
const showExportDialog = ref(false);
const exportFormat = ref<'csv' | 'json' | 'xlsx'>('csv');

// **NOVÉ: Outage management**
const showOutageDialog = ref(false);
const creatingOutage = ref(false);
const outageData = ref({
  outageNote: '',
  outageExpectedStockDate: ''
});

// **NOVÉ: URL fotky produktu**
const photoUrl = computed(() => {
  if (!product.value?.photoId) return null;
  return `https://smart-be.naturalprotein.net/?entryPoint=image&size=medium&id=${product.value.photoId}`;
});

// **NOVÉ: Upload fotky**
const uploadingPhoto = ref(false);
const photoInput = ref<HTMLInputElement | null>(null);

// **NOVÉ: Grafy**
const transactions = ref<InventoryTransaction[]>([]);
const loadingTransactions = ref(false);

// **NOVÉ: Dodavatelé**
const suppliers = ref<AccountListItem[]>([]);
const loadingSuppliers = ref(false);
const searchSuppliers = ref('');
const availableSuppliers = ref<AccountListItem[]>([]);
const selectedSupplierIds = ref<string[]>([]);
const supplierData = ref<Record<string, { supplierSku: string | null; costPrice: number | null }>>({});

const inventoryCardHeaders = ref([
  { title: 'Sklad / Období', key: 'warehouseName', sortable: true },
  { title: 'Aktuální stav', key: 'currentStockQuantity', sortable: true },
  { title: 'Požadavky na výdej', key: 'issueRequestQuantity', sortable: true },
  { title: 'Stav s požadavky', key: 'currentStockQuantityWithIssueRequests', sortable: true },
  { title: 'Hodnota zásob', key: 'currentStockValue', sortable: true },
  { title: 'Průměrná cena', key: 'averageCostPrice', sortable: true },
  { title: 'Poslední cena', key: 'lastCostPrice', sortable: true }
]);

// Computed vlastnosti pro sumarizaci skladových karet
const totalStockQuantity = computed(() => {
  return inventoryCards.value.reduce((sum, card) => sum + card.currentStockQuantity, 0);
});

const totalStockValue = computed(() => {
  return inventoryCards.value.reduce((sum, card) => sum + card.currentStockValue, 0);
});

const averageCostPrice = computed(() => {
  if (inventoryCards.value.length === 0) return 0;
  const sum = inventoryCards.value.reduce((sum, card) => sum + card.averageCostPrice, 0);
  return sum / inventoryCards.value.length;
});

// **NOVÉ: Computed data pro grafy**

// Filtrované transakce - pouze z posledních 14 dnů (2 týdny)
const filteredTransactions = computed(() => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return transactions.value.filter(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    return transactionDate >= twoWeeksAgo;
  });
});

// Graf 1: Výdeje a příjmy v čase
const transactionChartOptions = computed(() => {
  return {
    chart: {
      type: 'line',
      height: 300,
      fontFamily: 'inherit',
      foreColor: '#666',
      toolbar: {
        show: true
      }
    },
    colors: ['#4CAF50', '#f44336'],
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'dd.MM.yyyy'
      }
    },
    yaxis: {
      title: {
        text: 'Množství (ks)'
      },
      labels: {
        formatter: (value: number) => Math.round(value).toString()
      }
    },
    legend: {
      show: true,
      position: 'top'
    },
    tooltip: {
      x: {
        format: 'dd.MM.yyyy'
      },
      y: {
        formatter: (value: number) => `${Math.round(value)} ks`
      }
    },
    grid: {
      borderColor: '#e7e7e7'
    }
  };
});

const transactionChartSeries = computed(() => {
  // Agreguj data podle data transakce (pouze z posledních 14 dnů)
  const receiptsByDate = new Map<string, number>();
  const issuesByDate = new Map<string, number>();

  filteredTransactions.value.forEach(transaction => {
    const date = new Date(transaction.transactionDate).getTime();
    const quantity = transaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    // Fix: Správné hodnoty z API jsou typPohybu.prijem a typPohybu.vydej
    if (transaction.transactionDirection === 'typPohybu.prijem') {
      receiptsByDate.set(transaction.transactionDate, (receiptsByDate.get(transaction.transactionDate) || 0) + quantity);
    } else if (transaction.transactionDirection === 'typPohybu.vydej') {
      issuesByDate.set(transaction.transactionDate, (issuesByDate.get(transaction.transactionDate) || 0) + quantity);
    }
  });

  // Konverze do formátu pro ApexCharts
  const receiptsData = Array.from(receiptsByDate.entries())
    .map(([date, quantity]) => ({
      x: new Date(date).getTime(),
      y: quantity
    }))
    .sort((a, b) => a.x - b.x);

  const issuesData = Array.from(issuesByDate.entries())
    .map(([date, quantity]) => ({
      x: new Date(date).getTime(),
      y: quantity
    }))
    .sort((a, b) => a.x - b.x);

  return [
    {
      name: 'Příjemky',
      data: receiptsData
    },
    {
      name: 'Výdejky',
      data: issuesData
    }
  ];
});

// Graf 2: Nákladová vs prodejní cena v čase
const priceChartOptions = computed(() => {
  return {
    chart: {
      type: 'line',
      height: 300,
      fontFamily: 'inherit',
      foreColor: '#666',
      toolbar: {
        show: true
      }
    },
    colors: ['#f44336', '#4CAF50'],
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'dd.MM.yyyy'
      }
    },
    yaxis: {
      title: {
        text: 'Cena (Kč)'
      },
      labels: {
        formatter: (value: number) => `${Math.round(value)} Kč`
      }
    },
    legend: {
      show: true,
      position: 'top'
    },
    tooltip: {
      x: {
        format: 'dd.MM.yyyy'
      },
      y: {
        formatter: (value: number) => `${Math.round(value)} Kč`
      }
    },
    grid: {
      borderColor: '#e7e7e7'
    }
  };
});

const priceChartSeries = computed(() => {
  // Nákladová cena z inventoryCards (pouze z posledních 14 dnů)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const costPriceData = inventoryCards.value
    .filter(card => new Date(card.createdAt) >= twoWeeksAgo)
    .map(card => ({
      x: new Date(card.createdAt).getTime(),
      y: card.averageCostPrice
    }))
    .sort((a, b) => a.x - b.x);

  // Prodejní cena - použijeme aktuální cenu produktu jako konstantu
  const sellingPrice = product.value?.priceWithoutVat || 0;

  // Vytvoříme data pro prodejní cenu - stejná data jako pro nákladovou, ale s prodejní cenou
  const sellingPriceData = costPriceData.map(point => ({
    x: point.x,
    y: sellingPrice
  }));

  return [
    {
      name: 'Nákladová cena',
      data: costPriceData
    },
    {
      name: 'Prodejní cena',
      data: sellingPriceData
    }
  ];
});

// Editovatelná data
const editData = ref<UpdateProductData>({});

const isModified = computed(() => {
  if (!product.value || !editMode.value) return false;

  // Kontrola změn v základních datech
  const basicDataChanged = Object.keys(editData.value).some(key => {
    return editData.value[key as keyof UpdateProductData] !== product.value![key as keyof Product];
  });

  // Kontrola změn v dodavatelích
  const suppliersChanged = JSON.stringify(selectedSupplierIds.value.sort()) !==
    JSON.stringify((product.value.accountsIds || []).sort());

  // Kontrola změn v supplier data (SKU, ceny)
  const supplierDataChanged = JSON.stringify(supplierData.value) !==
    JSON.stringify(product.value.accountsColumns || {});

  return basicDataChanged || suppliersChanged || supplierDataChanged;
});

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return '—';
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
  if (type === 'typZasoby.material') return 'Surovina';
  if (type === 'typZasoby.vyrobek') return 'Výrobek';
  return type;
};

const getVatRateLabel = (vatRate: string) => {
  if (vatRate === 'typSzbDph.dphZakl') return 'DPH Základní (21%)';
  if (vatRate === 'typSzbDph.dphSniz') return 'DPH Snížená (12%)';
  return 'Bez DPH';
};

const getPriceTypeLabel = (priceType: string) => {
  if (priceType === 'typCeny.sDph') return 'S DPH';
  return 'Bez DPH';
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
      uomId: product.value.uomId || undefined,
      minimumStockQuantity: product.value.minimumStockQuantity
    };

    // Vypni loading pro základní informace
    loading.value = false;

    // Načti skladové karty, transakce a dodavatele na pozadí (bez await)
    loadInventoryCards();
    loadTransactions();
    loadSuppliers();
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání produktu';
    console.error('Chyba při načítání produktu:', err);
    loading.value = false;
  }
};

const loadInventoryCards = async () => {
  if (!productId) return;

  loadingInventoryCards.value = true;
  inventoryCardsError.value = null;

  try {
    console.log('📦 Načítám skladové karty pro produkt:', productId);
    inventoryCards.value = await inventoryCardService.getByProductId(productId);
    console.log('✅ Načteno skladových karet:', inventoryCards.value.length);
  } catch (err: any) {
    inventoryCardsError.value = err.message || 'Chyba při načítání skladových karet';
    console.error('❌ Chyba při načítání skladových karet:', err);
  } finally {
    loadingInventoryCards.value = false;
  }
};

/**
 * **NOVÉ: Načte transakce pro grafy**
 */
const loadTransactions = async () => {
  if (!productId) return;

  loadingTransactions.value = true;

  try {
    console.log('📊 Načítám transakce pro produkt:', productId);
    transactions.value = await inventoryTransactionService.getByProductId(productId);
    console.log('✅ Načteno transakcí:', transactions.value.length);
  } catch (err: any) {
    console.error('❌ Chyba při načítání transakcí:', err);
    // Nebudeme zobrazovat error, grafy prostě budou prázdné
  } finally {
    loadingTransactions.value = false;
  }
};

/**
 * **NOVÉ: Načte dodavatele pro autocomplete**
 */
const searchSuppliersDebounced = async (query: string) => {
  if (!query || query.length < 2) {
    availableSuppliers.value = [];
    return;
  }

  loadingSuppliers.value = true;

  try {
    const response = await accountService.getSuppliers({
      searchText: query.trim(),
      maxSize: 50,
      offset: 0,
      orderBy: 'name',
      order: 'asc'
    });
    availableSuppliers.value = response.list;
    console.log('🔍 Nalezeno dodavatelů:', availableSuppliers.value.length);
  } catch (err: any) {
    console.error('❌ Chyba při vyhledávání dodavatelů:', err);
    availableSuppliers.value = [];
  } finally {
    loadingSuppliers.value = false;
  }
};

/**
 * **NOVÉ: Načte dodavatele produktu**
 */
const loadSuppliers = async () => {
  if (!product.value?.accountsIds || product.value.accountsIds.length === 0) {
    suppliers.value = [];
    selectedSupplierIds.value = [];
    supplierData.value = {};
    return;
  }

  loadingSuppliers.value = true;

  try {
    // Načti detaily všech dodavatelů
    const supplierPromises = product.value.accountsIds.map(id => accountService.getById(id));
    const suppliersData = await Promise.all(supplierPromises);

    suppliers.value = suppliersData.map(s => ({
      id: s.id,
      name: s.name,
      website: s.website,
      type: s.type,
      billingAddressCountry: s.billingAddressCountry,
      createdAt: s.createdAt,
      createdById: s.createdById,
      assignedUserId: s.assignedUserId,
      isStarred: s.isStarred
    }));

    selectedSupplierIds.value = [...product.value.accountsIds];
    supplierData.value = { ...(product.value.accountsColumns || {}) };

    console.log('✅ Načteno dodavatelů:', suppliers.value.length);
  } catch (err: any) {
    console.error('❌ Chyba při načítání dodavatelů:', err);
  } finally {
    loadingSuppliers.value = false;
  }
};

const toggleEditMode = () => {
  if (editMode.value && product.value) {
    // Zrušení editace - obnovit původní data
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
      uomId: product.value.uomId || undefined,
      minimumStockQuantity: product.value.minimumStockQuantity
    };
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
    // Připrav suppliers data pro update
    if (selectedSupplierIds.value.length > 0) {
      editData.value.accountsIds = selectedSupplierIds.value;

      // Vytvoř accountsNames z suppliers
      const accountsNames: Record<string, string> = {};
      selectedSupplierIds.value.forEach(id => {
        const supplier = suppliers.value.find(s => s.id === id);
        if (supplier) {
          accountsNames[id] = supplier.name;
        }
      });
      editData.value.accountsNames = accountsNames;

      // Připrav accountsColumns
      editData.value.accountsColumns = supplierData.value;
    } else {
      editData.value.accountsIds = [];
      editData.value.accountsNames = {};
      editData.value.accountsColumns = {};
    }

    console.log('📤 Odesílám update s daty:', editData.value);
    const updated = await productsService.update(productId, editData.value);
    product.value = updated;
    editMode.value = false;

    // Reload suppliers aby se zobrazily aktuální data
    await loadSuppliers();

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

/**
 * Označení produktu jako dostupného (nastavení outageFlag na false)
 */
const markingAsAvailable = ref(false);

const markAsAvailable = async () => {
  if (!product.value) return;

  markingAsAvailable.value = true;
  error.value = null;

  try {
    console.log('📤 Označuji produkt jako dostupný');
    const updated = await productsService.update(productId, { outageFlag: false });
    product.value = updated;
    alert('Produkt byl označen jako dostupný');
  } catch (err: any) {
    error.value = err.message || 'Chyba při aktualizaci produktu';
    console.error('Chyba při označení jako dostupný:', err);
  } finally {
    markingAsAvailable.value = false;
  }
};

/**
 * **NOVÉ: Nastavení produktu jako nedostupného**
 */
const openOutageDialog = () => {
  outageData.value = {
    outageNote: product.value?.outageNote || '',
    outageExpectedStockDate: product.value?.outageExpectedStockDate || ''
  };
  showOutageDialog.value = true;
};

const createOutage = async () => {
  if (!product.value) return;

  creatingOutage.value = true;
  error.value = null;

  try {
    console.log('📤 Nastavuji produkt jako nedostupný');
    const updated = await productsService.update(productId, {
      outageFlag: true,
      outageNote: outageData.value.outageNote || undefined,
      outageExpectedStockDate: outageData.value.outageExpectedStockDate || undefined
    });
    product.value = updated;
    showOutageDialog.value = false;
    alert('Produkt byl nastaven jako nedostupný');
  } catch (err: any) {
    error.value = err.message || 'Chyba při aktualizaci produktu';
    console.error('Chyba při nastavení jako nedostupný:', err);
  } finally {
    creatingOutage.value = false;
  }
};

/**
 * **NOVÉ: Duplikace produktu**
 */
const duplicateProduct = async () => {
  if (!product.value) return;
  
  if (!confirm(`Opravdu chcete duplikovat produkt "${product.value.name}"?`)) {
    return;
  }
  
  duplicating.value = true;
  error.value = null;
  
  try {
    // Vytvoř nový produkt s daty z aktuálního produktu
    const newProductData: CreateProductData = {
      name: `${product.value.name} (Kopie)`,
      code: `${product.value.code}-COPY-${Date.now()}`, // Unikátní kód
      description: product.value.description,
      ean: product.value.ean ? `${product.value.ean}-COPY` : undefined,
      priceWithoutVat: product.value.priceWithoutVat,
      priceWithVat: product.value.priceWithVat,
      price: product.value.price,
      stockType: product.value.stockType,
      isStockItem: product.value.isStockItem,
      vatRate: product.value.vatRate,
      priceType: product.value.priceType,
      productGroupId: product.value.productGroupId || undefined,
      uomId: product.value.uomId || ''
    };
    
    console.log('📋 Duplikuji produkt:', newProductData);
    const duplicated = await productsService.create(newProductData);
    console.log('✅ Produkt zduplikován:', duplicated);
    
    // Naviguj na nový produkt
    router.push(`/products/${duplicated.id}`);
  } catch (err: any) {
    error.value = err.message || 'Chyba při duplikaci produktu';
    console.error('❌ Chyba při duplikaci:', err);
  } finally {
    duplicating.value = false;
  }
};

/**
 * **NOVÉ: Export do CSV**
 */
const exportToCSV = () => {
  if (!product.value) return;
  
  try {
    // Hlavička CSV
    const headers = [
      'ID',
      'Abra ID',
      'Kód',
      'Název',
      'Popis',
      'EAN',
      'Cena bez DPH',
      'Cena s DPH',
      'Typ zásob',
      'Skladová položka',
      'Sazba DPH',
      'Měrná jednotka',
      'Skupina produktů',
      'Vytvořeno',
      'Upraveno'
    ];
    
    // Data produktu
    const data = [
      product.value.id,
      product.value.abraId,
      product.value.code,
      `"${product.value.name}"`, // Escapování uvozovek
      `"${product.value.description || ''}"`,
      product.value.ean || '',
      product.value.priceWithoutVat || '',
      product.value.priceWithVat || '',
      getStockTypeLabel(product.value.stockType),
      product.value.isStockItem ? 'Ano' : 'Ne',
      getVatRateLabel(product.value.vatRate),
      product.value.uomName || '',
      product.value.productGroupName || '',
      product.value.createdAt,
      product.value.modifiedAt || ''
    ];
    
    // Přidání skladových karet pokud existují
    let csvContent = headers.join(',') + '\n';
    csvContent += data.join(',') + '\n';
    
    // Přidání skladových karet jako samostatné sekce
    if (inventoryCards.value.length > 0) {
      csvContent += '\n\nSkladové karty:\n';
      csvContent += 'Sklad,Období,Aktuální stav,Požadavky,Stav s požadavky,Hodnota zásob,Průměrná cena,Poslední cena\n';
      
      inventoryCards.value.forEach(card => {
        csvContent += [
          `"${card.warehouseName}"`,
          `"${card.accountingPeriodName}"`,
          card.currentStockQuantity,
          card.issueRequestQuantity,
          card.currentStockQuantityWithIssueRequests,
          card.currentStockValue,
          card.averageCostPrice,
          card.lastCostPrice
        ].join(',') + '\n';
      });
    }
    
    // Vytvoření a stažení souboru
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `produkt_${product.value.code}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Export do CSV úspěšný');
  } catch (err: any) {
    error.value = err.message || 'Chyba při exportu do CSV';
    console.error('❌ Chyba při exportu:', err);
  }
};

/**
 * **NOVÉ: Export do JSON**
 */
const exportToJSON = () => {
  if (!product.value) return;
  
  try {
    // Vytvoř JSON objekt s produktem a skladovými kartami
    const exportData = {
      product: {
        ...product.value,
        stockTypeLabel: getStockTypeLabel(product.value.stockType),
        vatRateLabel: getVatRateLabel(product.value.vatRate),
        priceTypeLabel: getPriceTypeLabel(product.value.priceType)
      },
      inventoryCards: inventoryCards.value,
      summary: {
        totalStockQuantity: totalStockQuantity.value,
        totalStockValue: totalStockValue.value,
        averageCostPrice: averageCostPrice.value
      },
      exportedAt: new Date().toISOString()
    };
    
    // Vytvoření a stažení souboru
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `produkt_${product.value.code}_${Date.now()}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Export do JSON úspěšný');
  } catch (err: any) {
    error.value = err.message || 'Chyba při exportu do JSON';
    console.error('❌ Chyba při exportu:', err);
  }
};

/**
 * **NOVÉ: Otevře dialog pro výběr formátu exportu**
 */
const openExportDialog = () => {
  showExportDialog.value = true;
};

/**
 * **NOVÉ: Provede export podle vybraného formátu**
 */
const performExport = () => {
  showExportDialog.value = false;

  switch (exportFormat.value) {
    case 'csv':
      exportToCSV();
      break;
    case 'json':
      exportToJSON();
      break;
    case 'xlsx':
      alert('Export do XLSX bude dostupný v příští verzi');
      break;
  }
};

/**
 * **NOVÉ: Otevře dialog pro výběr fotky**
 */
const openPhotoDialog = () => {
  photoInput.value?.click();
};

/**
 * **NOVÉ: Upload fotky produktu**
 */
const handlePhotoUpload = async (event: Event) => {
  if (!product.value) return;

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // Validace typu souboru
  if (!file.type.startsWith('image/')) {
    error.value = 'Můžete nahrát pouze obrázky';
    return;
  }

  // Validace velikosti (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Obrázek je příliš velký (max 10MB)';
    return;
  }

  uploadingPhoto.value = true;
  error.value = null;

  try {
    console.log('📸 Nahrávám fotku:', file.name);
    const updated = await productsService.uploadPhoto(productId, file);
    product.value = updated;

    // Refresh data produktu aby se načetla nová fotka
    await loadProduct();

    console.log('✅ Fotka úspěšně nahrána');
  } catch (err: any) {
    error.value = err.message || 'Chyba při nahrávání fotky';
    console.error('❌ Chyba při nahrávání fotky:', err);
  } finally {
    uploadingPhoto.value = false;
    // Reset input aby bylo možné nahrát stejný soubor znovu
    if (input) input.value = '';
  }
};

/**
 * **NOVÉ: Handler pro změnu vybraných dodavatelů**
 */
const handleSuppliersChange = async (selectedIds: string[]) => {
  // Odeber dodavatele, kteří již nejsou vybraní
  const removedIds = selectedSupplierIds.value.filter(id => !selectedIds.includes(id));
  removedIds.forEach(id => {
    delete supplierData.value[id];
  });

  // Přidej nové dodavatele
  const newIds = selectedIds.filter(id => !selectedSupplierIds.value.includes(id));
  for (const id of newIds) {
    if (!supplierData.value[id]) {
      supplierData.value[id] = { supplierSku: null, costPrice: null };
    }

    // Načti dodavatele pokud ještě není v suppliers
    if (!suppliers.value.find(s => s.id === id)) {
      try {
        const supplier = await accountService.getById(id);
        suppliers.value.push({
          id: supplier.id,
          name: supplier.name,
          website: supplier.website,
          type: supplier.type,
          billingAddressCountry: supplier.billingAddressCountry,
          createdAt: supplier.createdAt,
          createdById: supplier.createdById,
          assignedUserId: supplier.assignedUserId,
          isStarred: supplier.isStarred
        });
      } catch (err) {
        console.error('❌ Chyba při načítání dodavatele:', err);
      }
    }
  }

  selectedSupplierIds.value = selectedIds;
};

/**
 * **NOVÉ: Handler pro změnu SKU dodavatele**
 */
const handleSupplierSkuChange = (supplierId: string, sku: string) => {
  if (!supplierData.value[supplierId]) {
    supplierData.value[supplierId] = { supplierSku: null, costPrice: null };
  }
  supplierData.value[supplierId].supplierSku = sku || null;
};

/**
 * **NOVÉ: Handler pro změnu ceny dodavatele**
 */
const handleSupplierCostPriceChange = (supplierId: string, price: number | null) => {
  if (!supplierData.value[supplierId]) {
    supplierData.value[supplierId] = { supplierSku: null, costPrice: null };
  }
  supplierData.value[supplierId].costPrice = price;
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

          <template v-if="editMode">
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

      <!-- Varování o chybějícím produktu -->
      <v-alert
        v-if="product.outageFlag"
        type="warning"
        variant="tonal"
        class="mb-4"
        prominent
      >
        <v-row align="center">
          <v-col class="grow">
            <div class="text-h6">
              <v-icon start>mdi-alert-circle</v-icon>
              Produkt momentálně chybí
            </div>
            <div v-if="product.outageNote" class="mt-2">
              {{ product.outageNote }}
            </div>
            <div v-if="product.outageExpectedStockDate" class="mt-1 text-body-2">
              Očekávaný příjem: {{ formatDate(product.outageExpectedStockDate) }}
            </div>
          </v-col>
          <v-col class="flex-grow-0">
            <v-btn
              color="success"
              prepend-icon="mdi-check-circle"
              @click="markAsAvailable"
              :loading="markingAsAvailable"
            >
              Produkt je již dostupný
            </v-btn>
          </v-col>
        </v-row>
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
                  label="Nákladová cena"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  suffix="Kč"
                  prepend-inner-icon="mdi-currency-usd"
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Nákladová cena</div>
                  <div class="text-h6 font-weight-bold text-primary mt-2" style="color: red !important;">
                    {{ formatPrice(product.costPrice) }}
                  </div>
                </div>
              </v-col>

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
                  <div class="text-h6 font-weight-bold text-primary mt-2" style="color: green !important;">
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
                  <div class="text-body-1 font-weight-medium mt-2">{{ getVatRateLabel(product.vatRate) }}</div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis">Typ ceny</div>
                  <div class="text-body-1 font-weight-medium mt-2">{{ getPriceTypeLabel(product.priceType) }}</div>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>

          <!-- Skladové karty -->
          <UiParentCard title="Skladové karty" class="mt-4">
            <template v-slot:action>
              <v-btn
                color="primary"
                size="small"
                prepend-icon="mdi-refresh"
                @click="loadInventoryCards"
                :loading="loadingInventoryCards"
              >
                Obnovit
              </v-btn>
            </template>

            <v-alert
              v-if="inventoryCardsError"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="inventoryCardsError = null"
            >
              <strong>Chyba:</strong> {{ inventoryCardsError }}
            </v-alert>

            <v-data-table
              :headers="inventoryCardHeaders"
              :items="inventoryCards"
              :loading="loadingInventoryCards"
              hide-default-footer
              class="elevation-1"
            >
              <template v-slot:item.warehouseName="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-warehouse</v-icon>
                  <div>
                    <div class="font-weight-medium">{{ item.warehouseName }}</div>
                    <div class="text-caption text-medium-emphasis">
                      Období: {{ item.accountingPeriodName }}
                    </div>
                  </div>
                </div>
              </template>

              <template v-slot:item.currentStockQuantity="{ item }">
                <v-chip 
                  :color="item.currentStockQuantity > 0 ? 'success' : 'error'" 
                  size="small"
                  variant="tonal"
                >
                  {{ item.currentStockQuantity }} ks
                </v-chip>
              </template>

              <template v-slot:item.currentStockValue="{ item }">
                <span class="font-weight-bold text-primary">
                  {{ formatPrice(item.currentStockValue) }}
                </span>
              </template>

              <template v-slot:item.averageCostPrice="{ item }">
                <span class="font-weight-medium">
                  {{ formatPrice(item.averageCostPrice) }}
                </span>
              </template>

              <template v-slot:item.lastCostPrice="{ item }">
                <span class="font-weight-medium">
                  {{ formatPrice(item.lastCostPrice) }}
                </span>
              </template>

              <template v-slot:item.issueRequestQuantity="{ item }">
                <v-chip 
                  v-if="item.issueRequestQuantity > 0"
                  color="warning" 
                  size="small"
                  variant="tonal"
                >
                  {{ item.issueRequestQuantity }} ks
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>

              <template v-slot:item.currentStockQuantityWithIssueRequests="{ item }">
                <span class="font-weight-medium">
                  {{ item.currentStockQuantityWithIssueRequests }} ks
                </span>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-1">mdi-warehouse</v-icon>
                  <div class="text-h6 mt-4">Žádné skladové karty</div>
                  <div class="text-caption text-medium-emphasis">
                    Pro tento produkt nejsou evidovány žádné skladové karty
                  </div>
                </div>
              </template>

              <template v-slot:bottom>
                <div class="pa-4 bg-grey-lighten-4">
                  <v-row>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-medium-emphasis">Celkový stav zásob</div>
                      <div class="text-h6 font-weight-bold text-success">
                        {{ totalStockQuantity }} ks
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-medium-emphasis">Celková hodnota zásob</div>
                      <div class="text-h6 font-weight-bold text-primary">
                        {{ formatPrice(totalStockValue) }}
                      </div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-medium-emphasis">Průměrná nákupní cena</div>
                      <div class="text-h6 font-weight-bold">
                        {{ formatPrice(averageCostPrice) }}
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </template>
            </v-data-table>
          </UiParentCard>

          <UiParentCard title="Skladové informace" class="mt-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-if="editMode"
                  v-model="editData.stockType"
                  :items="[
                    { title: 'Zboží', value: 'typZasoby.zbozi' },
                    { title: 'Surovina', value: 'typZasoby.material' },
                    { title: 'Výrobek', value: 'typZasoby.vyrobek' }
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

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="editMode"
                  v-model.number="editData.minimumStockQuantity"
                  label="Minimální skladové množství"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  min="0"
                  step="0.01"
                  prepend-inner-icon="mdi-alert"
                  hint="Minimální množství na skladě před upozorněním"
                  persistent-hint
                ></v-text-field>
                <div v-else>
                  <div class="text-subtitle-2 text-medium-emphasis">Minimální skladové množství</div>
                  <v-chip
                    v-if="product.minimumStockQuantity !== null && product.minimumStockQuantity !== undefined"
                    :color="totalStockQuantity < product.minimumStockQuantity ? 'error' : 'success'"
                    class="mt-2"
                  >
                    <v-icon start size="small">
                      {{ totalStockQuantity < product.minimumStockQuantity ? 'mdi-alert-circle' : 'mdi-check-circle' }}
                    </v-icon>
                    {{ product.minimumStockQuantity }} {{ product.uomName || 'ks' }}
                  </v-chip>
                  <div v-else class="text-body-1 font-weight-medium mt-2">—</div>
                </div>
              </v-col>
            </v-row>
          </UiParentCard>

          <!-- **NOVÉ: Dodavatelé** -->
          <UiParentCard title="Dodavatelé" class="mt-4">
            <template v-slot:action>
              <v-btn
                v-if="editMode"
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                @click="searchSuppliers = ''"
              >
                Spravovat
              </v-btn>
            </template>

            <div v-if="editMode">
              <v-autocomplete
                v-model="selectedSupplierIds"
                v-model:search="searchSuppliers"
                :items="availableSuppliers"
                :loading="loadingSuppliers"
                item-title="name"
                item-value="id"
                label="Vyberte dodavatele"
                placeholder="Začněte psát pro vyhledání..."
                variant="outlined"
                density="comfortable"
                multiple
                chips
                clearable
                prepend-inner-icon="mdi-truck"
                @update:model-value="handleSuppliersChange"
                @update:search="searchSuppliersDebounced"
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    :text="item.raw.name"
                    closable
                  ></v-chip>
                </template>

                <template v-slot:item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :title="item.raw.name"
                    :subtitle="item.raw.website || 'Bez webové stránky'"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-domain</v-icon>
                    </template>
                  </v-list-item>
                </template>

                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ searchSuppliers && searchSuppliers.length >= 2 ? 'Žádní dodavatelé nenalezeni' : 'Začněte psát pro vyhledání...' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>

              <!-- Detail dodavatelů s editací SKU a Cost Price -->
              <v-row v-if="selectedSupplierIds.length > 0" class="mt-4">
                <v-col cols="12">
                  <div class="text-subtitle-2 text-medium-emphasis mb-3">Detail dodavatelů:</div>
                </v-col>

                <v-col
                  v-for="supplierId in selectedSupplierIds"
                  :key="supplierId"
                  cols="12"
                >
                  <v-card variant="outlined" class="pa-4">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" class="mr-2">mdi-domain</v-icon>
                      <div class="text-h6">
                        {{ suppliers.find(s => s.id === supplierId)?.name || 'Načítání...' }}
                      </div>
                    </div>

                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          :model-value="supplierData[supplierId]?.supplierSku || ''"
                          @update:model-value="(val: string) => handleSupplierSkuChange(supplierId, val)"
                          label="SKU dodavatele"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-barcode"
                          placeholder="Zadejte SKU"
                        ></v-text-field>
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-text-field
                          :model-value="supplierData[supplierId]?.costPrice"
                          @update:model-value="(val: any) => handleSupplierCostPriceChange(supplierId, val ? parseFloat(val) : null)"
                          label="Nákupní cena"
                          type="number"
                          variant="outlined"
                          density="comfortable"
                          suffix="Kč"
                          prepend-inner-icon="mdi-currency-usd"
                          placeholder="Zadejte cenu"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- View mode - zobrazení dodavatelů -->
            <div v-else>
              <div v-if="!loadingSuppliers && suppliers.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-truck</v-icon>
                <div class="text-h6 mt-4">Žádní dodavatelé</div>
                <div class="text-caption text-medium-emphasis">
                  Pro tento produkt nejsou evidováni žádní dodavatelé
                </div>
              </div>

              <v-row v-else>
                <v-col
                  v-for="supplier in suppliers"
                  :key="supplier.id"
                  cols="12"
                  md="6"
                >
                  <v-card variant="outlined" class="pa-4">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" class="mr-2" size="32">mdi-domain</v-icon>
                      <div>
                        <div class="text-h6">{{ supplier.name }}</div>
                        <div v-if="supplier.website" class="text-caption text-medium-emphasis">
                          {{ supplier.website }}
                        </div>
                      </div>
                    </div>

                    <v-divider class="my-3"></v-divider>

                    <div class="mb-2">
                      <div class="text-subtitle-2 text-medium-emphasis">SKU dodavatele</div>
                      <div class="text-body-1 font-weight-medium mt-1">
                        {{ supplierData[supplier.id]?.supplierSku || '—' }}
                      </div>
                    </div>

                    <div>
                      <div class="text-subtitle-2 text-medium-emphasis">Nákupní cena</div>
                      <div class="text-h6 font-weight-bold text-primary mt-1">
                        {{ supplierData[supplier.id]?.costPrice ? formatPrice(supplierData[supplier.id].costPrice) : '—' }}
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <div v-if="loadingSuppliers" class="text-center py-8">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <div class="text-caption text-medium-emphasis mt-2">
                  Načítání dodavatelů...
                </div>
              </div>
            </div>
          </UiParentCard>

          <!-- **GRAFY: Graf výdejů a příjmů** -->
          <UiParentCard title="Vývoj množství na skladě" class="mt-4">
            <template v-slot:action>
              <v-btn
                icon
                size="small"
                variant="text"
                @click="loadTransactions"
                :loading="loadingTransactions"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </template>

            <div v-if="loadingTransactions" class="py-8">
              <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
              <div class="text-center text-caption text-medium-emphasis mt-2">
                Načítání dat grafu...
              </div>
            </div>

            <div v-else-if="transactionChartSeries[0].data.length === 0 && transactionChartSeries[1].data.length === 0" class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
              <div class="text-subtitle-2 text-medium-emphasis mt-2">
                Žádná data k zobrazení
              </div>
            </div>

            <apexchart
              v-else
              type="line"
              :height="300"
              :options="transactionChartOptions"
              :series="transactionChartSeries"
            ></apexchart>
          </UiParentCard>

          <!-- **GRAFY: Graf nákladové vs prodejní ceny** -->
          <UiParentCard title="Vývoj nákladové ceny" class="mt-4">
            <template v-slot:action>
              <v-btn
                icon
                size="small"
                variant="text"
                @click="loadInventoryCards"
                :loading="loadingInventoryCards"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </template>

            <div v-if="loadingInventoryCards" class="py-8">
              <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
              <div class="text-center text-caption text-medium-emphasis mt-2">
                Načítání dat grafu...
              </div>
            </div>

            <div v-else-if="priceChartSeries[0].data.length === 0" class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
              <div class="text-subtitle-2 text-medium-emphasis mt-2">
                Žádná data k zobrazení
              </div>
            </div>

            <apexchart
              v-else
              type="line"
              :height="300"
              :options="priceChartOptions"
              :series="priceChartSeries"
            ></apexchart>
          </UiParentCard>
        </v-col>

        <!-- Boční panel -->
        <v-col cols="12" md="4">
          <!-- **NOVÉ: Přehled zásob - NAHOŘE** -->
          <v-card variant="outlined" class="mb-4" v-if="inventoryCards.length > 0">
            <v-card-text class="pa-4">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-warehouse</v-icon>
                Přehled zásob
              </div>

              <div class="mb-4 pa-3 rounded" style="background: #e8f5e9;">
                <div class="text-subtitle-2 text-medium-emphasis mb-1">Celkový stav na skladě</div>
                <div class="text-h4 font-weight-bold text-success">
                  {{ totalStockQuantity }} {{ product?.uomName || 'ks' }}
                </div>
              </div>

              <div class="mb-4 pa-3 rounded" style="background: #e3f2fd;">
                <div class="text-subtitle-2 text-medium-emphasis mb-1">Celková hodnota zásob</div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ formatPrice(totalStockValue) }}
                </div>
              </div>

              <v-divider class="my-3"></v-divider>

              <div class="mb-3">
                <div class="text-subtitle-2 text-medium-emphasis">Skladů celkem</div>
                <div class="text-h6 font-weight-bold mt-1">
                  {{ inventoryCards.length }}
                </div>
              </div>

              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Průměrná nákupní cena</div>
                <div class="text-h6 font-weight-bold mt-1">
                  {{ formatPrice(averageCostPrice) }}
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- **NOVÉ: Fotka produktu** -->
          <v-card variant="outlined" class="mb-4">
            <v-img
              v-if="photoUrl"
              :src="photoUrl"
              :alt="product.name"
              cover
              aspect-ratio="1"
              class="product-photo"
            >
              <template v-slot:placeholder>
                <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
                >
                  <v-progress-circular
                    indeterminate
                    color="primary"
                  ></v-progress-circular>
                </v-row>
              </template>
              <template v-slot:error>
                <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
                >
                  <v-icon size="64" color="grey-lighten-1">
                    mdi-image-off
                  </v-icon>
                </v-row>
              </template>
            </v-img>

            <!-- Placeholder pokud není fotka -->
            <div v-else class="d-flex align-center justify-center" style="height: 300px; background: #f5f5f5;">
              <v-icon size="64" color="grey-lighten-1">
                mdi-image-outline
              </v-icon>
            </div>

            <v-card-text class="pa-2">
              <div class="text-center text-caption text-medium-emphasis mb-2">
                {{ product.photoName || 'Žádná fotka' }}
              </div>

              <!-- Upload button -->
              <input
                ref="photoInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handlePhotoUpload"
              />
              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-camera"
                @click="openPhotoDialog"
                :loading="uploadingPhoto"
                size="small"
              >
                {{ photoUrl ? 'Změnit fotku' : 'Nahrát fotku' }}
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Metadata -->
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
              <div class="mb-4">
                <div class="text-subtitle-2 text-medium-emphasis">Abra ID</div>
                <div class="text-body-1 font-weight-medium mt-2">{{ product.abraId }}</div>
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

          <!-- Rychlé akce -->
          <v-card variant="outlined" class="mt-4">
            <v-card-text>
              <div class="text-h6 mb-4">Rychlé akce</div>
              
              <v-btn 
                block 
                variant="outlined" 
                class="mb-2" 
                prepend-icon="mdi-refresh" 
                @click="loadProduct"
                :loading="loading"
              >
                Obnovit data
              </v-btn>
              
              <v-btn 
                block 
                variant="outlined" 
                class="mb-2" 
                prepend-icon="mdi-content-copy"
                @click="duplicateProduct"
                :loading="duplicating"
              >
                Duplikovat
              </v-btn>
              
              <v-btn
                block
                variant="outlined"
                class="mb-2"
                prepend-icon="mdi-file-export"
                @click="openExportDialog"
                :loading="exporting"
              >
                Exportovat
              </v-btn>

              <!-- Outage Management Buttons -->
              <v-btn
                v-if="!product?.outageFlag"
                block
                variant="outlined"
                class="mb-2"
                prepend-icon="mdi-alert-circle"
                color="warning"
                @click="openOutageDialog"
              >
                Nastavit jako nedostupný
              </v-btn>

              <v-btn
                v-if="product?.outageFlag"
                block
                variant="outlined"
                class="mb-2"
                prepend-icon="mdi-check-circle"
                color="success"
                @click="markAsAvailable"
                :loading="markingAsAvailable"
              >
                Ukončit nedostupnost
              </v-btn>

              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-file-tree"
                @click="router.push(`/products/${productId}/bom`)"
                v-if="product?.stockType === 'typZasoby.vyrobek' || product?.stockType === 'typZasoby.zbozi'"
              >
                Kusovník (BOM)
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <!-- Dialog pro výběr formátu exportu -->
  <v-dialog v-model="showExportDialog" max-width="400">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Exportovat produkt</span>
        <v-btn icon variant="text" @click="showExportDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <div class="text-subtitle-2 mb-3">Vyberte formát exportu:</div>
        <v-radio-group v-model="exportFormat">
          <v-radio value="csv">
            <template v-slot:label>
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-file-delimited</v-icon>
                <div>
                  <div class="font-weight-medium">CSV</div>
                  <div class="text-caption text-medium-emphasis">
                    Excel kompatibilní formát
                  </div>
                </div>
              </div>
            </template>
          </v-radio>
          
          <v-radio value="json">
            <template v-slot:label>
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-code-json</v-icon>
                <div>
                  <div class="font-weight-medium">JSON</div>
                  <div class="text-caption text-medium-emphasis">
                    Kompletní data včetně skladových karet
                  </div>
                </div>
              </div>
            </template>
          </v-radio>
          
          <v-radio value="xlsx" disabled>
            <template v-slot:label>
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-file-excel</v-icon>
                <div>
                  <div class="font-weight-medium">XLSX</div>
                  <div class="text-caption text-medium-emphasis">
                    Připravujeme...
                  </div>
                </div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="showExportDialog = false">
          Zrušit
        </v-btn>
        <v-btn color="primary" @click="performExport">
          Exportovat
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pro nastavení nedostupnosti -->
  <v-dialog v-model="showOutageDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Nastavit produkt jako nedostupný</span>
        <v-btn icon variant="text" @click="showOutageDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Vyplňte informace o nedostupnosti produktu
        </div>

        <v-textarea
          v-model="outageData.outageNote"
          label="Poznámka o nedostupnosti"
          placeholder="Např. Produkt dočasně nedostupný u dodavatele"
          rows="3"
          variant="outlined"
          class="mb-4"
        ></v-textarea>

        <v-text-field
          v-model="outageData.outageExpectedStockDate"
          label="Očekávaný příjem"
          type="date"
          variant="outlined"
          hint="Kdy očekáváte opětovnou dostupnost"
          persistent-hint
        ></v-text-field>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="showOutageDialog = false">
          Zrušit
        </v-btn>
        <v-btn
          color="warning"
          @click="createOutage"
          :loading="creatingOutage"
        >
          Nastavit jako nedostupný
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
:deep(.v-card) {
  border-radius: 8px;
}

:deep(.v-data-table) {
  border-radius: 8px;
}

.product-photo {
  border-radius: 8px 8px 0 0;
}
</style>