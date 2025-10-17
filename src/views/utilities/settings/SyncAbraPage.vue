<!-- src/views/utilities/settings/SyncAbraPage.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { reloadAbraService } from '@/services/reloadAbraService';
import type { ReloadAbraResponse } from '@/services/reloadAbraService';

const page = ref({ title: 'Synchronizace s Abra' });
const breadcrumbs = ref([
  { title: 'Nastavení', disabled: false, href: '#' },
  { title: 'Synchronizace', disabled: true, href: '#' }
]);

interface SyncEntity {
  id: string;
  name: string;
  description: string;
  icon: string;
  loading: boolean;
  result: ReloadAbraResponse | null;
  error: string | null;
}

const entities = ref<SyncEntity[]>([
  {
    id: 'inventoryTransactionType',
    name: 'Typy skladových pohybů',
    description: 'Synchronizuje typy pohybů ze systému Abra',
    icon: 'mdi-swap-horizontal',
    loading: false,
    result: null,
    error: null
  },
  {
    id: 'product',
    name: 'Produkty',
    description: 'Synchronizuje produkty ze systému Abra',
    icon: 'mdi-package-variant',
    loading: false,
    result: null,
    error: null
  },
  {
    id: 'warehouse',
    name: 'Sklady',
    description: 'Synchronizuje sklady ze systému Abra',
    icon: 'mdi-warehouse',
    loading: false,
    result: null,
    error: null
  }
]);

const syncAll = async () => {
  for (const entity of entities.value) {
    await syncEntity(entity);
  }
};

const syncEntity = async (entity: SyncEntity) => {
  entity.loading = true;
  entity.error = null;
  entity.result = null;

  try {
    let result: ReloadAbraResponse;

    switch (entity.id) {
      case 'inventoryTransactionType':
        result = await reloadAbraService.syncInventoryTransactionType();
        break;
      case 'product':
        result = await reloadAbraService.syncProduct();
        break;
      case 'warehouse':
        result = await reloadAbraService.syncWarehouse();
        break;
      default:
        throw new Error('Neznámá entita');
    }

    entity.result = result;
  } catch (err: any) {
    entity.error = err.message || 'Chyba při synchronizaci';
    console.error(`Chyba při synchronizaci ${entity.name}:`, err);
  } finally {
    entity.loading = false;
  }
};

const getStatusColor = (entity: SyncEntity) => {
  if (entity.loading) return 'info';
  if (entity.error) return 'error';
  if (entity.result?.success) return 'success';
  return 'default';
};

const getStatusIcon = (entity: SyncEntity) => {
  if (entity.loading) return 'mdi-loading mdi-spin';
  if (entity.error) return 'mdi-alert-circle';
  if (entity.result?.success) return 'mdi-check-circle';
  return 'mdi-sync';
};

const clearResults = () => {
  entities.value.forEach(entity => {
    entity.result = null;
    entity.error = null;
  });
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Synchronizace dat z Abra">
        <div class="mb-4">
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-information</v-icon>
              <div>
                <strong>Synchronizace s Abra</strong>
                <div class="text-caption mt-1">
                  Tato stránka umožňuje synchronizovat data ze systému Abra do EspoCRM. 
                  Synchronizace může trvat několik minut v závislosti na množství dat.
                </div>
              </div>
            </div>
          </v-alert>

          <div class="d-flex gap-2 mb-6">
            <v-btn
              color="primary"
              prepend-icon="mdi-sync"
              @click="syncAll"
              :loading="entities.some(e => e.loading)"
            >
              Synchronizovat vše
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-broom"
              @click="clearResults"
              :disabled="entities.some(e => e.loading)"
            >
              Vyčistit výsledky
            </v-btn>
          </div>
        </div>

        <v-row>
          <v-col 
            v-for="entity in entities" 
            :key="entity.id"
            cols="12"
            md="4"
          >
            <v-card 
              :class="['sync-card', entity.loading ? 'loading' : '']"
              elevation="2"
            >
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-avatar :color="getStatusColor(entity)" size="48" class="mr-3">
                    <v-icon :class="entity.loading ? 'rotating' : ''">
                      {{ entity.icon }}
                    </v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ entity.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ entity.description }}
                    </div>
                  </div>
                </div>

                <!-- Výsledek synchronizace -->
                <v-alert
                  v-if="entity.result && !entity.error"
                  type="success"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  <div class="text-caption">
                    <strong>{{ entity.result.message }}</strong>
                  </div>
                  <div class="text-caption mt-1">
                    Celkem: {{ entity.result.total }} | 
                    Zpracováno: {{ entity.result.processed }} | 
                    Smazáno: {{ entity.result.deleted }}
                  </div>
                </v-alert>

                <!-- Chyba -->
                <v-alert
                  v-if="entity.error"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  {{ entity.error }}
                </v-alert>

                <!-- Detail položek -->
                <v-expansion-panels v-if="entity.result && entity.result.items.length > 0">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <span class="text-caption">
                        Synchronizované položky ({{ entity.result.items.length }})
                      </span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="item in entity.result.items"
                          :key="item.id"
                        >
                          <template v-slot:prepend>
                            <v-chip 
                              size="x-small" 
                              :color="item.action === 'updated' ? 'info' : 'success'"
                            >
                              {{ item.action }}
                            </v-chip>
                          </template>
                          <v-list-item-title class="text-caption">
                            {{ item.name }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-caption">
                            Abra ID: {{ item.abraId }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-btn
                  block
                  :color="entity.loading ? 'default' : 'primary'"
                  :variant="entity.loading ? 'outlined' : 'flat'"
                  @click="syncEntity(entity)"
                  :loading="entity.loading"
                  class="mt-3"
                >
                  <v-icon start :class="entity.loading ? 'rotating' : ''">
                    {{ getStatusIcon(entity) }}
                  </v-icon>
                  {{ entity.loading ? 'Synchronizuji...' : 'Synchronizovat' }}
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Logy -->
        <v-card variant="outlined" class="mt-6" v-if="entities.some(e => e.result || e.error)">
          <v-card-title>Historie synchronizace</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-timeline density="compact" side="end">
              <v-timeline-item
                v-for="entity in entities.filter(e => e.result || e.error)"
                :key="entity.id"
                :dot-color="entity.error ? 'error' : 'success'"
                size="small"
              >
                <div class="d-flex align-center">
                  <strong class="mr-2">{{ entity.name }}</strong>
                  <v-chip 
                    size="small" 
                    :color="entity.error ? 'error' : 'success'"
                    variant="tonal"
                  >
                    {{ entity.error ? 'Chyba' : 'Úspěch' }}
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ entity.result?.message || entity.error }}
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.sync-card {
  transition: all 0.3s ease;
}

.sync-card.loading {
  border: 2px solid rgb(var(--v-theme-info));
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}
</style>