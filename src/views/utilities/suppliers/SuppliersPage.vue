<!-- src/views/utilities/suppliers/SuppliersPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Dodavatelé' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Dodavatelé', disabled: true, href: '#' }
]);

const suppliers = ref([
  { 
    id: 1, 
    name: 'Dodavatel A', 
    email: 'kontakt@dodavatel-a.cz',
    phone: '+420 777 111 222',
    address: 'Průmyslová 15',
    city: 'Praha',
    country: 'CZ',
    productsCount: 25
  },
  { 
    id: 2, 
    name: 'Dodavatel B', 
    email: 'info@dodavatel-b.cz',
    phone: '+420 606 333 444',
    address: 'Obchodní 88',
    city: 'Brno',
    country: 'CZ',
    productsCount: 18
  },
  { 
    id: 3, 
    name: 'Dodavatel C', 
    email: 'obchod@dodavatel-c.cz',
    phone: '+420 723 555 666',
    address: 'Tovární 42',
    city: 'Ostrava',
    country: 'CZ',
    productsCount: 12
  },
  { 
    id: 4, 
    name: 'Dodavatel D', 
    email: 'eshop@dodavatel-d.cz',
    phone: '+420 774 777 888',
    address: 'Sportovní 7',
    city: 'Plzeň',
    country: 'CZ',
    productsCount: 8
  }
]);

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Telefon', key: 'phone', sortable: false },
  { title: 'Město', key: 'city', sortable: true },
  { title: 'Počet produktů', key: 'productsCount', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const search = ref('');
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam dodavatelů">
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Hledat dodavatele"
            single-line
            hide-details
            variant="outlined"
            density="compact"
            style="max-width: 400px"
          ></v-text-field>
          
          <v-btn color="primary" prepend-icon="mdi-plus">
            Nový dodavatel
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="suppliers"
          :search="search"
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar color="secondary" size="32" class="mr-3">
                <v-icon color="white">mdi-domain</v-icon>
              </v-avatar>
              <span class="font-weight-medium">{{ item.name }}</span>
            </div>
          </template>

          <template v-slot:item.email="{ item }">
            <a :href="`mailto:${item.email}`" class="text-primary text-decoration-none">
              {{ item.email }}
            </a>
          </template>

          <template v-slot:item.phone="{ item }">
            <a :href="`tel:${item.phone}`" class="text-decoration-none">
              {{ item.phone }}
            </a>
          </template>

          <template v-slot:item.productsCount="{ item }">
            <v-chip size="small" color="primary" variant="tonal">
              {{ item.productsCount }} produktů
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