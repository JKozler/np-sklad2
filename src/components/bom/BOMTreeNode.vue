<!-- BOMTreeNode.vue - Finální verze s měrnými jednotkami -->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { BOMNode } from '@/services/bomService';

interface Props {
  node: BOMNode;
  canEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true
});

const emit = defineEmits<{
  addChild: [node: BOMNode];
  edit: [node: BOMNode];
  delete: [node: BOMNode];
}>();

const router = useRouter();
const expanded = ref(true);

const formatPrice = (price: number | null) => {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const isMainBom = computed(() => {
  return props.node.level === 1 && props.node.parentBomId === null;
});

const totalPrice = computed(() => {
  if (!props.node.costPrice) return null;
  return props.node.costPrice * props.node.quantity;
});

const navigateToProduct = () => {
  router.push(`/products/${props.node.componentProductId}`);
};
</script>

<template>
  <div class="bom-tree-node">
    <!-- Node content -->
    <v-card
      :class="['mb-2', isMainBom ? 'main-bom-card' : '']"
      :variant="isMainBom ? 'tonal' : 'outlined'"
      :color="isMainBom ? 'primary' : 'default'"
    >
      <v-card-text class="py-2">
        <div class="d-flex align-center">
          <!-- Expand/Collapse button -->
          <v-btn
            v-if="node.children.length > 0"
            icon
            size="x-small"
            variant="text"
            @click="expanded = !expanded"
            class="mr-2"
          >
            <v-icon>
              {{ expanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
            </v-icon>
          </v-btn>
          <div v-else style="width: 32px"></div>

          <!-- Level indicator -->
          <v-chip
            size="x-small"
            :color="isMainBom ? 'primary' : 'secondary'"
            variant="flat"
            class="mr-2"
          >
            L{{ node.level }}
          </v-chip>

          <!-- Product info -->
          <div class="flex-grow-1">
            <div class="d-flex align-center">
              <v-icon class="mr-2" :color="isMainBom ? 'primary' : 'default'">
                {{ isMainBom ? 'mdi-package-variant' : 'mdi-package-variant-closed' }}
              </v-icon>
              <div>
                <!-- Klikatelný název produktu -->
                <div 
                  class="text-body-1 font-weight-medium product-link" 
                  @click="navigateToProduct"
                >
                  {{ node.componentProductName }}
                  <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
                </div>
                <div class="text-caption text-medium-emphasis">
                  ID: {{ node.componentProductId }}
                  <span v-if="node.abraId"> | Abra: {{ node.abraId }}</span>
                  <!-- **NOVÉ: Měrná jednotka pokud je k dispozici** -->
                  <span v-if="node.uom"> | MJ: {{ node.uom }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quantity s měrnou jednotkou -->
          <div class="mx-4 text-center">
            <div class="text-caption text-medium-emphasis">Množství</div>
            <v-chip color="info" size="small" variant="tonal">
              {{ node.quantity }}
              <!-- **NOVÉ: Zobraz MJ pokud je k dispozici** -->
              <span v-if="node.uom" class="ml-1">{{ node.uom }}</span>
              <span v-else>x</span>
            </v-chip>
          </div>

          <!-- Price info -->
          <div class="mx-4 text-right" style="min-width: 120px">
            <div class="text-caption text-medium-emphasis">Cena/ks</div>
            <div class="text-body-2 font-weight-medium">
              {{ formatPrice(node.costPrice) }}
            </div>
            <!-- Celková cena POUZE pro hlavní BOM -->
            <div 
              class="text-caption text-primary font-weight-bold" 
              v-if="totalPrice && isMainBom"
            >
              Celkem: {{ formatPrice(totalPrice) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="ml-4" v-if="canEdit">
            <v-menu>
              <template v-slot:activator="{ props: menuProps }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  v-bind="menuProps"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="emit('addChild', node)">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-plus</v-icon>
                  </template>
                  <v-list-item-title>Přidat podkomponentu</v-list-item-title>
                </v-list-item>
                <v-list-item @click="emit('edit', node)" v-if="!isMainBom">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-pencil</v-icon>
                  </template>
                  <v-list-item-title>Upravit</v-list-item-title>
                </v-list-item>
                <v-divider v-if="!isMainBom"></v-divider>
                <v-list-item @click="emit('delete', node)" v-if="!isMainBom" class="text-error">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-delete</v-icon>
                  </template>
                  <v-list-item-title>Smazat</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Children -->
    <div v-if="expanded && node.children.length > 0" class="children-container">
      <BOMTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :can-edit="canEdit"
        @add-child="emit('addChild', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.bom-tree-node {
  margin-left: 0;
}

.children-container {
  margin-left: 40px;
  border-left: 2px solid rgba(var(--v-theme-primary), 0.2);
  padding-left: 16px;
  padding-top: 8px;
}

.main-bom-card {
  border: 2px solid rgba(var(--v-theme-primary), 0.5);
}

.product-link {
  cursor: pointer;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
}

.product-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

:deep(.v-card) {
  transition: all 0.2s ease;
}

:deep(.v-card:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>