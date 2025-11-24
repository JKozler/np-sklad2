<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const loading = ref(true);

onMounted(() => {
  loading.value = false;
});
</script>

<template>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Customer Support Dashboard">
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex align-center mb-4">
                <v-icon size="48" color="primary">mdi-headset</v-icon>
                <div class="ml-4">
                  <div class="text-h4 font-weight-bold">24</div>
                  <div class="text-subtitle-2 text-medium-emphasis">Aktivní tikety</div>
                </div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex align-center mb-4">
                <v-icon size="48" color="success">mdi-check-circle</v-icon>
                <div class="ml-4">
                  <div class="text-h4 font-weight-bold">156</div>
                  <div class="text-subtitle-2 text-medium-emphasis">Vyřešené dnes</div>
                </div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-alert type="info" variant="tonal">
              <v-icon>mdi-information</v-icon>
              <span class="ml-2">Vítejte v Customer Support Dashboard</span>
            </v-alert>
          </v-col>
        </v-row>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
