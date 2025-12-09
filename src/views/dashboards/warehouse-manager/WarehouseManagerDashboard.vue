<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import TotalIncome from '../default/components/TotalIncome.vue';
import OrdersReportCard from '../default/components/OrdersReportCard.vue';
import TotalEarning from '../default/components/TotalEarning.vue';

const loading = ref(true);
const activeTab = ref(0);

onMounted(() => {
  loading.value = false;
});
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <v-tabs v-model="activeTab" bg-color="primary">
          <v-tab value="0">Tržba/Sklad</v-tab>
          <v-tab value="1">Sklad surovin/expedice</v-tab>
          <v-tab value="2">Přehled objednávek</v-tab>
          <v-tab value="3">Přehled stavu</v-tab>
          <v-tab value="4">Chybějící produkty na výdej</v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="0">
              <TotalEarning />
            </v-window-item>

            <v-window-item value="1">
              <TotalIncome />
            </v-window-item>

            <v-window-item value="2">
              <OrdersReportCard />
            </v-window-item>
            <v-window-item value="3">
                <v-card-text style="height: 1200px;">
                  <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/ff3e7a62b357416d8c0f0722f5334d97"></iframe>
                </v-card-text>
            </v-window-item>
            <v-window-item value="4">
                <v-card-text style="height: 1200px;">
                  <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/dbb77efda0044da69637dda45a1b4b64"></iframe>
                </v-card-text>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
