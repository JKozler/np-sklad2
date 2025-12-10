<script setup lang="ts">
import { ref, onMounted } from 'vue';

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
          <v-tab value="0">Chybějící produkty</v-tab>
          <v-tab value="1">Přehled problémů a stavů</v-tab>
          <v-tab value="2">Data error objednávky</v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="0">
              
                <v-card-text style="height: 1200px;">
                  <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/870563a41cee4b76bee310b74f4446c4"></iframe>
                </v-card-text>
            </v-window-item>

            <v-window-item value="1">
                <v-card-text style="height: 1200px;">
                  <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/ff3e7a62b357416d8c0f0722f5334d97"></iframe>
                </v-card-text>
            </v-window-item>
            <v-window-item value="2">
                <v-card-text style="height: 1200px;">
                  <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/7e15c1c17e7542268f3e5cd390761afd?orgId=1"></iframe>
                </v-card-text>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
