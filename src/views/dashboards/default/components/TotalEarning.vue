<script setup lang="ts">
import { shallowRef } from 'vue';
import { ArchiveIcon, CopyIcon, DownloadIcon, FileExportIcon } from 'vue-tabler-icons';
import iconCard from '@/assets/images/icons/icon-card.svg';
const items = shallowRef([
  { title: 'Import Card', icon: DownloadIcon },
  { title: 'Copy Data', icon: CopyIcon },
  { title: 'Export', icon: FileExportIcon },
  { title: 'Archive File', icon: ArchiveIcon }
]);
</script>

<template>
  <v-card elevation="0" class="bg-secondary overflow-hidden bubble-shape bubble-secondary-shape">
    <v-card-text style="height: 500px;">
      <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/118af7179b31468f87d963012b7cd254"></iframe>
    </v-card-text>
  </v-card>
</template>
