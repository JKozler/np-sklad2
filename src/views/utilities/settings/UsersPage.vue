<!-- src/views/utilities/settings/UsersPage.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Správa uživatelů' });
const breadcrumbs = ref([
  { title: 'Nastavení', disabled: false, href: '#' },
  { title: 'Uživatelé', disabled: true, href: '#' }
]);

const users = ref([
  {
    id: 1,
    email: 'admin@naturalprotein.cz',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-10-07 14:30'
  },
  {
    id: 2,
    email: 'user@naturalprotein.cz',
    firstName: 'Jan',
    lastName: 'Novák',
    role: 'user',
    status: 'active',
    lastLogin: '2024-10-06 09:15'
  },
  {
    id: 3,
    email: 'manager@naturalprotein.cz',
    firstName: 'Marie',
    lastName: 'Svobodová',
    role: 'manager',
    status: 'active',
    lastLogin: '2024-10-07 11:45'
  }
]);

const headers = ref([
  { title: 'Uživatel', key: 'user', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Poslední přihlášení', key: 'lastLogin', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const roleColors: Record<string, string> = {
  admin: 'error',
  manager: 'warning',
  user: 'info'
};

const roleLabels: Record<string, string> = {
  admin: 'Administrátor',
  manager: 'Manažer',
  user: 'Uživatel'
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam uživatelů">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-account-plus">
            Přidat uživatele
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="users"
          class="elevation-1"
        >
          <template v-slot:item.user="{ item }">
            <div class="d-flex align-center">
              <v-avatar color="primary" size="40" class="mr-3">
                <span class="text-white">
                  {{ item.firstName.charAt(0) }}{{ item.lastName.charAt(0) }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.firstName }} {{ item.lastName }}</div>
              </div>
            </div>
          </template>

          <template v-slot:item.email="{ item }">
            <a :href="`mailto:${item.email}`" class="text-primary text-decoration-none">
              {{ item.email }}
            </a>
          </template>

          <template v-slot:item.role="{ item }">
            <v-chip 
              :color="roleColors[item.role]" 
              size="small"
              variant="tonal"
            >
              {{ roleLabels[item.role] }}
            </v-chip>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip 
              :color="item.status === 'active' ? 'success' : 'error'" 
              size="small"
              variant="tonal"
            >
              {{ item.status === 'active' ? 'Aktivní' : 'Neaktivní' }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon size="small" variant="text" color="primary">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="error">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>