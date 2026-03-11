<script setup lang="ts">
  import { Store } from '@tauri-apps/plugin-store';
  import { computed } from 'vue';
  import { useConfigStore } from '@/stores/config.ts';
  import { useLogStore } from '@/stores/log.ts';

  const configStore = useConfigStore();
  const logStore = useLogStore();

  const configItems = computed(() => {
    return configStore.configs.map((config, index) => ({
      title: config.title,
      value: index,
    }));
  });

  async function onSelectionChange () {
    const store = await Store.load('settings1.json');
    await configStore.saveConfig(store);
    logStore.clearLog();
    await configStore.initConfig(store);
  }
</script>

<template>
  <v-select
    v-model="configStore.selectedIndex"
    class="mr-2"
    density="compact"
    hide-details
    item-title="title"
    item-value="value"
    :items="configItems"
    label="Config"
    variant="solo"
    width="200"
    @update:model-value="onSelectionChange"
  />
</template>

<style scoped lang="sass">

</style>
