<!-- src/views/utilities/customers/CustomersPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { customersService } from '@/services/customersService';
import type { Customer } from '@/types/auth';

const page = ref({ title: 'Zákazníci' });
const breadcrumbs = ref([
  { title: 'CRM', disabled: false, href: '#' },
  { title: 'Zákazníci', disabled: true, href: '#' }
]);

const search = ref('');
const customers = ref<Customer[]>([]);
const loading = ref(false);
const itemsPerPage = ref(10);
const currentPage = ref(1);
const showDialog = ref(false);
const editingCustomer = ref<Customer | null>(null);

const headers = ref([
  { title: 'Jméno', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Telefon', key: 'phone', sortable: false },
  { title: 'Společnost', key: 'company', sortable: true },
  { title: 'Město', key: 'city', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const filteredCustomers = computed(() => {
  return customers.value.map((c: Customer) => ({
    ...c,
    name: `${c.firstName} ${c.lastName}`
  }));
});

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredCustomers.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / itemsPerPage.value);
});

const loadCustomers = async () => {
  loading.value = true;
  try {
    customers.value = await customersService.getAll(search.value);
  } catch (error) {
    console.error('Chyba při načítání zákazníků:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingCustomer.value = null;
  showDialog.value = true;
};

const openEditDialog = (customer: Customer) => {
  editingCustomer.value = { ...customer };
  showDialog.value = true;
};

const deleteCustomer = async (id: number) => {
  if (confirm('Opravdu chcete smazat tohoto zákazníka?')) {
    try {
      await customersService.delete(id);
      await loadCustomers();
    } catch (error) {
      console.error('Chyba při mazání zákazníka:', error);
    }
  }
};

onMounted(() => {
  loadCustomers();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam zákazníků">
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="search"
            @update:model-value="loadCustomers"
            prepend-inner-icon="mdi-magnify"
            label="Hledat zákazníka"
            single-line
            hide-details
            variant="outlined"
            density="compact"
            class="search-field"
            style="max-width: 400px"
          ></v-text-field>
          
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
            Nový zákazník
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="paginatedCustomers"
          :loading="loading"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar color="primary" size="32" class="mr-3">
                <span class="text-white text-caption">
                  {{ item.firstName.charAt(0) }}{{ item.lastName.charAt(0) }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis" v-if="item.company">
                  {{ item.company }}
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.email="{ item }">
            <a :href="`mailto:${item.email}`" class="text-primary text-decoration-none">
              {{ item.email }}
            </a>
          </template>

          <template v-slot:item.phone="{ item }">
            <a v-if="item.phone" :href="`tel:${item.phone}`" class="text-decoration-none">
              {{ item.phone }}
            </a>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.company="{ item }">
            {{ item.company || '—' }}
          </template>

          <template v-slot:item.city="{ item }">
            {{ item.city || '—' }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openEditDialog(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              @click="deleteCustomer(item.id)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Položek na stránku:</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[10, 25, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 100px"
                ></v-select>
              </div>
              
              <div class="text-body-2">
                {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredCustomers.length) }} 
                z {{ filteredCustomers.length }}
              </div>

              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
              ></v-pagination>
            </div>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.search-field {
  min-width: 250px;
}

:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.v-data-table th) {
  font-weight: 600;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.02);
}
</style>