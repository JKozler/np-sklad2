<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import TotalEarning from '../default/components/TotalEarning.vue';
import TotalOrder from '../default/components/TotalOrder.vue';
import TotalIncome from '../default/components/TotalIncome.vue';

const loading = ref(true);

onMounted(() => {
  loading.value = false;
});
</script>

<template>
  <v-row>
    <!-- Warehouse stats -->
    <v-col cols="12" md="4">
      <v-card variant="outlined" class="pa-4">
        <div class="d-flex align-center mb-4">
          <v-icon size="48" color="primary">mdi-warehouse</v-icon>
          <div class="ml-4">
            <div class="text-h4 font-weight-bold">12</div>
            <div class="text-subtitle-2 text-medium-emphasis">Aktivních skladů</div>
          </div>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card variant="outlined" class="pa-4">
        <div class="d-flex align-center mb-4">
          <v-icon size="48" color="warning">mdi-package-variant</v-icon>
          <div class="ml-4">
            <div class="text-h4 font-weight-bold">43</div>
            <div class="text-subtitle-2 text-medium-emphasis">Čekající objednávky</div>
          </div>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card variant="outlined" class="pa-4">
        <div class="d-flex align-center mb-4">
          <v-icon size="48" color="success">mdi-truck-delivery</v-icon>
          <div class="ml-4">
            <div class="text-h4 font-weight-bold">28</div>
            <div class="text-subtitle-2 text-medium-emphasis">Expedované dnes</div>
          </div>
        </div>
      </v-card>
    </v-col>

    <!-- Existing components -->
    <v-col cols="12" md="12">
      <TotalEarning />
    </v-col>

    <v-col cols="12" md="12">
      <TotalIncome />
    </v-col>

    <v-col cols="12" md="4">
      <TotalOrder />
    </v-col>
  </v-row>
</template>
