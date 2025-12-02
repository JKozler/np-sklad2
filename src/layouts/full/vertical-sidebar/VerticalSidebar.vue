<script setup lang="ts">
import { computed } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import { useAuthStore } from '../../../stores/auth';
import sidebarItems from './sidebarItem';

import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import ExtraBox from './extrabox/ExtraBox.vue';
import Logo from '../logo/LogoMain.vue';

const customizer = useCustomizerStore();
const authStore = useAuthStore();

// Filter sidebar items based on user dashboards
const sidebarMenu = computed(() => {
  const userDashboards = authStore.currentUser?.dashboards || [];

  return sidebarItems.filter(item => {
    // Show items without requiredDashboards
    if (!item.requiredDashboards || item.requiredDashboards.length === 0) {
      return true;
    }

    // Check if user has at least one of the required dashboards
    return item.requiredDashboards.some(dashboard => userDashboards.includes(dashboard));
  });
});
</script>

<template>
  <v-navigation-drawer
    left
    v-model="customizer.Sidebar_drawer"
    elevation="0"
    rail-width="75"
    mobile-breakpoint="lg"
    app
    class="leftSidebar"
    :rail="customizer.mini_sidebar"
    expand-on-hover
  >
    <!---Logo part -->

    <div class="pa-5">
      <Logo />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <perfect-scrollbar class="scrollnavbar">
      <v-list class="pa-4">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!---Item Sub Header -->
          <NavGroup :item="item" v-if="item.header" :key="item.title" />
          <!---Item Divider -->
          <v-divider class="my-3" v-else-if="item.divider" />
          <!---If Has Child -->
          <NavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <NavItem :item="item" v-else class="leftPadding" />
          <!---End Single Item-->
        </template>
      </v-list>
      <div class="pa-4">
        <ExtraBox />
      </div>
      <div class="pa-4 text-center">
        <v-chip color="inputBorder" size="small"> v1.0.0 </v-chip>
      </div>
    </perfect-scrollbar>
  </v-navigation-drawer>
</template>
