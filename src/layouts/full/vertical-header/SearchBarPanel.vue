<script setup>
import { SearchIcon, AdjustmentsHorizontalIcon, XIcon } from 'vue-tabler-icons';
import GlobalSearch from '@/components/GlobalSearch.vue';

const props = defineProps({
  closesearch: {
    type: Function,
    required: false
  }
});
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- searchbar -->
  <!-- ---------------------------------------------- -->
  <GlobalSearch />
</template>
