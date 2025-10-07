<template>
  <div class="logo">
    <RouterLink to="/">
      <img style="width: 50px;" src="https://www.naturalprotein.cz//upload/images/bannery-hp-velke/podzim-logo-svg.svg" title="logo" class="svg">
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');
</script>
