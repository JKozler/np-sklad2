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
    <v-card elevation="0" class="bg-secondary overflow-hidden bubble-shape bubble-secondary-shape">
    <v-card-text style="height: 1200px;">
      <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/ff3e7a62b357416d8c0f0722f5334d97"></iframe>
    </v-card-text>
  </v-card>
  </v-row>
</template>
