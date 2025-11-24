<script setup lang="ts">
import { ref, computed } from 'vue';
import { SettingsIcon, LogoutIcon, UserIcon } from 'vue-tabler-icons';
import { useAuthStore } from '@/stores/auth';

const swt1 = ref(true);
const swt2 = ref(false);
const authStore = useAuthStore();

// User info from store
const userFullName = computed(() => authStore.fullName || 'Uživatel');
const userName = computed(() => authStore.userName || '');
const userDashboards = computed(() => {
  const dashboards = authStore.currentUser?.dashboards || [];
  if (dashboards.length === 0) return '';

  const labels: Record<string, string> = {
    'CUSTOMER_SUPPORT': 'Zákaznická podpora',
    'WAREHOUSE_MANAGER': 'Správce skladu'
  };

  return dashboards.map(d => labels[d] || d).join(', ');
});
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- profile DD -->
  <!-- ---------------------------------------------- -->
  <div class="pa-4">
    <div class="mb-2">
      <div class="text-h6 font-weight-bold">{{ userFullName }}</div>
      <div class="text-caption text-medium-emphasis">@{{ userName }}</div>
      <div v-if="userDashboards" class="text-caption text-primary mt-1">
        {{ userDashboards }}
      </div>
    </div>

    <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 515px">
      <div class="bg-lightwarning rounded-md pa-5 my-3 circle sm-circle lg-circle">
        <h4>V případě potřeby prosím volejte na</h4>
    <a href="tel:+420776877148">+420776877148</a>
      </div>

      <v-divider></v-divider>

      

      <v-divider></v-divider>

      <v-list class="mt-3">
        <v-list-item color="secondary" rounded="md" @click="$router.push('/profile')">
          <template v-slot:prepend>
            <SettingsIcon size="20" class="mr-2" />
          </template>

          <v-list-item-title class="text-subtitle-2"> Nastavení</v-list-item-title>
        </v-list-item>

        <v-list-item @click="authStore.logout()" color="secondary" rounded="md">
          <template v-slot:prepend>
            <LogoutIcon size="20" class="mr-2" />
          </template>

          <v-list-item-title class="text-subtitle-2"> Odhlásit</v-list-item-title>
        </v-list-item>
      </v-list>
    </perfect-scrollbar>
  </div>
</template>
