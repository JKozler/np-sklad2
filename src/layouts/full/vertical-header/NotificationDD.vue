<script setup lang="ts">
import { ref } from 'vue';
import { BuildingStoreIcon, SendIcon, MailboxIcon, PhotoIcon } from 'vue-tabler-icons';

const notificationDD = ref(['All Notifications', 'New', 'Unread', 'Other']);
const selectNotify = ref<string>('All Notifications');
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- notifications DD -->
  <!-- ---------------------------------------------- -->
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-3">
      <h6 class="text-subtitle-1">
        All Notifications
        <v-chip color="warning" variant="flat" size="small" class="ml-2 text-white">01</v-chip>
      </h6>
      <a href="#" class="text-decoration-underline text-primary text-subtitle-2">Mark as all read</a>
    </div>
    <v-select :items="notificationDD" v-model="selectNotify" color="primary" variant="outlined" density="default" hide-details></v-select>
  </div>
  <v-divider></v-divider>
  <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 650px">
    <v-list class="py-0" lines="three">
    </v-list>
  </perfect-scrollbar>
  <v-divider></v-divider>
  <div class="pa-2 text-center">
    <v-btn color="primary" variant="text">View All</v-btn>
  </div>
</template>
