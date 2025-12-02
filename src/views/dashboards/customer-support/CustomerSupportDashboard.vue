<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import TotalIncome from '../default/components/TotalIncome.vue';
import OrdersReportCard from '../default/components/OrdersReportCard.vue';
import TotalEarning from '../default/components/TotalEarning.vue';

const loading = ref(true);

onMounted(() => {
  loading.value = false;
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <TotalEarning />
    </v-col>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Income -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="12">
      <TotalIncome />
    </v-col>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Order -->
    <!-- -------------------------------------------------------------------- 
    <v-col cols="12" md="4">
      <TotalOrder />
    </v-col>-->

    <!-- -------------------------------------------------------------------- -->
    <!-- Total Growth -->
    <!--
    <v-col cols="12" lg="8">
      <TotalGrowth />
    </v-col> -->

    <!-- -------------------------------------------------------------------- -->
    <!-- Popular Stocks -->
    <!--
    <v-col cols="12" lg="4">
      <PopularStocks />
    </v-col> -->

    <!-- -------------------------------------------------------------------- -->
    <!-- Orders Report Card -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="12">
      <OrdersReportCard />
    </v-col>
  </v-row>
</template>
