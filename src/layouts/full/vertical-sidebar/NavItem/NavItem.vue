<script setup>
import Icon from '../IconSet.vue';
const props = defineProps({ item: Object, level: Number });
</script>
<template>
  <!---Single Item-->
  <v-list-item
    v-if="item.type === 'external'"
    :href="item.to"
    target="_blank"
    rel="noopener noreferrer"
    rounded
    class="mb-1"
    color="secondary"
    :disabled="item.disabled"
  >
    <!---If icon-->
    <template v-slot:prepend>
      <Icon :item="props.item.icon" :level="props.level" />
    </template>
    <v-list-item-title>{{ item.title }}</v-list-item-title>
    <!---If Caption-->
    <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
      {{ item.subCaption }}
    </v-list-item-subtitle>
    <!---If any chip or label-->
    <template v-slot:append v-if="item.chip">
      <v-chip
        :color="item.chipColor"
        class="sidebarchip hide-menu"
        :size="item.chipIcon ? 'small' : 'default'"
        :variant="item.chipVariant"
        :prepend-icon="item.chipIcon"
      >
        {{ item.chip }}
      </v-chip>
    </template>
  </v-list-item>

  <!---Single Item - Internal-->
  <v-list-item
    v-else
    :to="item.to"
    rounded
    class="mb-1"
    color="secondary"
    :disabled="item.disabled"
  >
    <!---If icon-->
    <template v-slot:prepend>
      <Icon :item="props.item.icon" :level="props.level" />
    </template>
    <v-list-item-title>{{ item.title }}</v-list-item-title>
    <!---If Caption-->
    <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
      {{ item.subCaption }}
    </v-list-item-subtitle>
    <!---If any chip or label-->
    <template v-slot:append v-if="item.chip">
      <v-chip
        :color="item.chipColor"
        class="sidebarchip hide-menu"
        :size="item.chipIcon ? 'small' : 'default'"
        :variant="item.chipVariant"
        :prepend-icon="item.chipIcon"
      >
        {{ item.chip }}
      </v-chip>
    </template>
  </v-list-item>
</template>