<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  orderReportsService,
  type OrderReportRow,
  type EshopChannel,
} from '@/services/orderReportsService';

// State
const loading = ref(true);
const currentTab = ref<'monthly' | 'daily'>('monthly');
const monthlyData = ref<Record<EshopChannel, OrderReportRow[]>>({
  'CZ-ESHOP': [],
  'SK-ESHOP': [],
  'HU-ESHOP': [],
});
const dailyData = ref<Record<EshopChannel, OrderReportRow[]>>({
  'CZ-ESHOP': [],
  'SK-ESHOP': [],
  'HU-ESHOP': [],
});

// Expandované sekce pro každý shop
const expandedShops = ref<Record<string, boolean>>({
  'CZ-ESHOP': true,
  'SK-ESHOP': true,
  'HU-ESHOP': true,
});

// Konfigurace shopů
const shops = [
  { channel: 'CZ-ESHOP' as EshopChannel, name: 'CZ', color: 'primary', flag: '🇨🇿' },
  { channel: 'SK-ESHOP' as EshopChannel, name: 'SK', color: 'info', flag: '🇸🇰' },
  { channel: 'HU-ESHOP' as EshopChannel, name: 'HU', color: 'success', flag: '🇭🇺' },
];

// Computed pro aktuální data
const currentData = computed(() => {
  return currentTab.value === 'monthly' ? monthlyData.value : dailyData.value;
});

// Načtení dat
const loadData = async () => {
  loading.value = true;
  try {
    // Načíst měsíční data (posledních 180 dní pro historii)
    const monthlyPromise = orderReportsService.getAllShopsReports('monthly', 180);

    // Načíst denní data (posledních 30 dní)
    const dailyPromise = orderReportsService.getAllShopsReports('daily', 30);

    // Načíst oboje paralelně
    const [monthlyResults, dailyResults] = await Promise.all([monthlyPromise, dailyPromise]);

    monthlyData.value = monthlyResults;
    dailyData.value = dailyResults;

    console.log('📊 Reports loaded:', { monthlyResults, dailyResults });
  } catch (error) {
    console.error('❌ Error loading reports:', error);
  } finally {
    loading.value = false;
  }
};

// Toggle sekce
const toggleShop = (channel: string) => {
  expandedShops.value[channel] = !expandedShops.value[channel];
};

// Formátování
const formatCurrency = (value: number, currency: string) => {
  return orderReportsService.formatCurrency(value, currency);
};

const formatDate = (dateStr: string) => {
  return orderReportsService.formatDate(dateStr, currentTab.value);
};

// Načíst data při mountu
onMounted(() => {
  loadData();
});
</script>

<template>
  <v-card elevation="0" class="bg-gradient overflow-hidden">
    <v-card-text class="pa-5">
      <!-- Header s taby -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h5 font-weight-bold">Přehledy objednávek</h3>

        <div class="d-flex gap-2 align-center">
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            @click="loadData"
            :loading="loading"
            title="Obnovit data"
          />
          <v-btn-toggle
            v-model="currentTab"
            color="primary"
            mandatory
            variant="outlined"
            divided
          >
            <v-btn value="monthly" size="small">
              <v-icon start>mdi-calendar-month</v-icon>
              Měsíc
            </v-btn>
            <v-btn value="daily" size="small">
              <v-icon start>mdi-calendar-today</v-icon>
              Denní
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>

      <!-- Loading state with placeholder -->
      <div v-if="loading" class="loading-placeholder">
        <div class="placeholder-card">
          <div class="placeholder-tabs">
            <v-chip color="primary" class="mr-2">Měsíc</v-chip>
            <v-chip variant="outlined">Rok</v-chip>
          </div>
          <div class="placeholder-text">
            Zde budou data...
          </div>
        </div>
      </div>

      <!-- Data pro každý shop -->
      <div v-if="!loading">
        <div
          v-for="shop in shops"
          :key="shop.channel"
          class="mb-4"
        >
          <!-- Shop header (expandable) -->
          <v-card
            :color="shop.color"
            variant="tonal"
            class="mb-2"
            @click="toggleShop(shop.channel)"
            style="cursor: pointer"
          >
            <v-card-text class="pa-3">
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex align-center gap-2">
                  <span class="text-h6">{{ shop.flag }}</span>
                  <span class="text-h6 font-weight-bold">
                    {{ shop.name }} {{ currentTab === 'monthly' ? 'Měsíční' : 'Denní' }}
                  </span>
                  <v-chip
                    size="small"
                    :color="shop.color"
                    variant="flat"
                  >
                    {{ currentData[shop.channel].length }} záznamů
                  </v-chip>
                </div>
                <v-icon>
                  {{ expandedShops[shop.channel] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
              </div>
            </v-card-text>
          </v-card>

          <!-- Shop data table -->
          <v-expand-transition>
            <div v-show="expandedShops[shop.channel]">
              <v-card elevation="0" variant="outlined" class="mb-3">
                <v-table density="compact" hover>
                  <thead>
                    <tr>
                      <th class="text-left font-weight-bold">Datum</th>
                      <th class="text-right font-weight-bold">Objednávky</th>
                      <th class="text-right font-weight-bold">Náklad celkem</th>
                      <th class="text-right font-weight-bold">Tržba bez dopravy</th>
                      <th class="text-right font-weight-bold">Tržba celkem</th>
                      <th class="text-right font-weight-bold">Zaplacená doprava</th>
                      <th class="text-right font-weight-bold">% náklad celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in currentData[shop.channel]"
                      :key="row.date"
                    >
                      <td class="font-weight-medium">{{ formatDate(row.date) }}</td>
                      <td class="text-right">{{ row.orderCount }}</td>
                      <td class="text-right">{{ formatCurrency(row.totalCost, row.currency) }}</td>
                      <td class="text-right">
                        {{ formatCurrency(row.revenueWithoutShipping, row.currency) }}
                      </td>
                      <td class="text-right font-weight-bold">
                        {{ formatCurrency(row.totalRevenue, row.currency) }}
                      </td>
                      <td class="text-right">{{ formatCurrency(row.shippingFees, row.currency) }}</td>
                      <td class="text-right">
                        <v-chip
                          size="small"
                          :color="row.costPercentage > 50 ? 'error' : row.costPercentage > 40 ? 'warning' : 'success'"
                        >
                          {{ row.costPercentage.toFixed(2) }}%
                        </v-chip>
                      </td>
                    </tr>
                    <tr v-if="currentData[shop.channel].length === 0">
                      <td colspan="7" class="text-center text-medium-emphasis pa-4">
                        Žádná data pro zobrazení
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </div>
          </v-expand-transition>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && shops.every(shop => currentData[shop.channel].length === 0)"
        class="text-center pa-8"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-chart-box-outline
        </v-icon>
        <p class="text-h6 text-medium-emphasis">
          Žádná data k zobrazení
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bg-gradient {
  background: #ffffff;
}

.v-table {
  background: transparent;
}

.v-table thead tr th {
  background-color: rgba(0, 0, 0, 0.03);
}

.gap-2 {
  gap: 8px;
}

.loading-placeholder {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-card {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  border-radius: 16px;
  padding: 48px;
  min-width: 500px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(30, 136, 229, 0.3);
}

.placeholder-tabs {
  margin-bottom: 32px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.placeholder-text {
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
