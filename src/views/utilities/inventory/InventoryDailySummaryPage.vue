<!-- src/views/utilities/inventory/InventoryDailySummaryPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import type { InventoryTransaction } from '@/services/inventoryTransactionService';

const router = useRouter();

const page = ref({ title: 'Denní přehled skladových pohybů' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Denní přehled', disabled: true, href: '#' }
]);

const transactions = ref<InventoryTransaction[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const expandedDate = ref<string | null>(null);

const dateFrom = ref<string>('');
const dateTo = ref<string>('');

interface DailySummary {
  date: string;
  prijemTotal: number;
  vydejTotal: number;
  prijemCount: number;
  vydejCount: number;
  balance: number;
  transactions: InventoryTransaction[];
}

/**
 * Agreguje transakce podle data
 */
const dailySummaries = computed(() => {
  const summaryMap = new Map<string, DailySummary>();

  transactions.value.forEach(transaction => {
    const date = transaction.transactionDate.split('T')[0]; // Získej jen datum (YYYY-MM-DD)

    if (!summaryMap.has(date)) {
      summaryMap.set(date, {
        date,
        prijemTotal: 0,
        vydejTotal: 0,
        prijemCount: 0,
        vydejCount: 0,
        balance: 0,
        transactions: []
      });
    }

    const summary = summaryMap.get(date)!;
    summary.transactions.push(transaction);

    // Rozlišuj příjem a výdej
    if (transaction.transactionDirection === 'typPohybu.prijem') {
      summary.prijemTotal += transaction.totalPrice || 0;
      summary.prijemCount++;
    } else if (transaction.transactionDirection === 'typPohybu.vydej') {
      summary.vydejTotal += transaction.totalPrice || 0;
      summary.vydejCount++;
    }
  });

  // Vypočítej bilanci
  summaryMap.forEach(summary => {
    summary.balance = summary.prijemTotal - summary.vydejTotal;
  });

  // Převeď na pole a seřaď podle data (nejnovější první)
  return Array.from(summaryMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
});

/**
 * Filtrované sumáře podle datového rozsahu
 */
const filteredSummaries = computed(() => {
  let filtered = [...dailySummaries.value];

  if (dateFrom.value) {
    filtered = filtered.filter(s => s.date >= dateFrom.value);
  }

  if (dateTo.value) {
    filtered = filtered.filter(s => s.date <= dateTo.value);
  }

  return filtered;
});

/**
 * Celkové statistiky
 */
const totalStats = computed(() => {
  return filteredSummaries.value.reduce((acc, summary) => {
    acc.prijemTotal += summary.prijemTotal;
    acc.vydejTotal += summary.vydejTotal;
    acc.prijemCount += summary.prijemCount;
    acc.vydejCount += summary.vydejCount;
    return acc;
  }, {
    prijemTotal: 0,
    vydejTotal: 0,
    prijemCount: 0,
    vydejCount: 0,
    balance: 0
  });
});

// Dopočítej bilanci
totalStats.value.balance = totalStats.value.prijemTotal - totalStats.value.vydejTotal;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const loadTransactions = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await inventoryTransactionService.getAll();
    transactions.value = response.list;
    console.log('✅ Načteno skladových pohybů:', transactions.value.length);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání skladových pohybů';
    console.error('❌ Chyba při načítání:', err);
  } finally {
    loading.value = false;
  }
};

const toggleExpand = (date: string) => {
  expandedDate.value = expandedDate.value === date ? null : date;
};

const viewTransaction = (transactionId: string) => {
  router.push(`/inventory-transactions/${transactionId}`);
};

const resetFilters = () => {
  dateFrom.value = '';
  dateTo.value = '';
};

onMounted(() => {
  loadTransactions();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <v-row>
    <v-col cols="12">
      <!-- Celkové statistiky -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Celkové příjmy</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ formatPrice(totalStats.prijemTotal) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ totalStats.prijemCount }} transakcí
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Celkové výdeje</div>
              <div class="text-h4 font-weight-bold mt-2 text-error">
                {{ formatPrice(totalStats.vydejTotal) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ totalStats.vydejCount }} transakcí
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Bilance</div>
              <div
                class="text-h4 font-weight-bold mt-2"
                :class="totalStats.balance >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatPrice(totalStats.balance) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                Příjem - Výdej
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Počet dnů</div>
              <div class="text-h4 font-weight-bold mt-2 text-primary">
                {{ filteredSummaries.length }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                s aktivitou
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Denní přehled skladových pohybů">
        <!-- Filtry -->
        <div class="mb-4">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="dateFrom"
                label="Datum od"
                type="date"
                variant="outlined"
                density="compact"
                clearable
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="dateTo"
                label="Datum do"
                type="date"
                variant="outlined"
                density="compact"
                clearable
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" class="d-flex align-start gap-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                @click="loadTransactions"
                :loading="loading"
              >
                Obnovit
              </v-btn>

              <v-btn
                variant="outlined"
                prepend-icon="mdi-filter-remove"
                @click="resetFilters"
              >
                Resetovat filtry
              </v-btn>
            </v-col>
          </v-row>
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

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <div class="text-h6 mt-4">Načítám data...</div>
        </div>

        <!-- Seznam dnů -->
        <div v-else>
          <v-expansion-panels v-if="filteredSummaries.length > 0">
            <v-expansion-panel
              v-for="summary in filteredSummaries"
              :key="summary.date"
            >
              <v-expansion-panel-title>
                <div class="d-flex justify-space-between align-center w-100 pr-4">
                  <div class="d-flex align-center">
                    <v-icon class="mr-3" color="primary">mdi-calendar</v-icon>
                    <div>
                      <div class="font-weight-medium">{{ formatDate(summary.date) }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ summary.prijemCount + summary.vydejCount }} transakcí
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-4">
                    <div class="text-right">
                      <div class="text-caption text-medium-emphasis">Příjem</div>
                      <div class="font-weight-bold text-success">
                        {{ formatPrice(summary.prijemTotal) }}
                      </div>
                    </div>

                    <div class="text-right">
                      <div class="text-caption text-medium-emphasis">Výdej</div>
                      <div class="font-weight-bold text-error">
                        {{ formatPrice(summary.vydejTotal) }}
                      </div>
                    </div>

                    <div class="text-right">
                      <div class="text-caption text-medium-emphasis">Bilance</div>
                      <div
                        class="font-weight-bold"
                        :class="summary.balance >= 0 ? 'text-success' : 'text-error'"
                      >
                        {{ formatPrice(summary.balance) }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <!-- Detail transakcí za den -->
                <v-list>
                  <v-list-item
                    v-for="transaction in summary.transactions"
                    :key="transaction.id"
                    @click="viewTransaction(transaction.id)"
                    class="mb-2"
                    style="cursor: pointer;"
                  >
                    <template v-slot:prepend>
                      <v-icon
                        :color="transaction.transactionDirection === 'typPohybu.prijem' ? 'success' : 'error'"
                      >
                        {{ transaction.transactionDirection === 'typPohybu.prijem' ? 'mdi-arrow-down-circle' : 'mdi-arrow-up-circle' }}
                      </v-icon>
                    </template>

                    <v-list-item-title class="font-weight-medium">
                      {{ transaction.name }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      {{ transaction.transactionTypeName }}
                      <span v-if="transaction.code" class="ml-2">• {{ transaction.code }}</span>
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <div class="text-right">
                        <div
                          class="font-weight-bold"
                          :class="transaction.transactionDirection === 'typPohybu.prijem' ? 'text-success' : 'text-error'"
                        >
                          {{ formatPrice(transaction.totalPrice || 0) }}
                        </div>
                        <v-chip
                          size="small"
                          :color="transaction.status === 'completed' ? 'success' : 'warning'"
                        >
                          {{ transaction.status === 'completed' ? 'Dokončeno' : 'Koncept' }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Prázdný stav -->
          <div v-else class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
            <div class="text-h6 mt-4">Žádná data</div>
            <div class="text-caption text-medium-emphasis">
              Pro vybraný časový rozsah nejsou k dispozici žádné skladové pohyby.
            </div>
          </div>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

.w-100 {
  width: 100%;
}

:deep(.v-expansion-panel-title) {
  padding: 16px 24px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 24px 16px;
}
</style>
