<template>
  <v-container>
    <v-text-field v-model="configStore.config.rdpFile" label="Path to rdp(x) File" :type="'text'" />
    <v-text-field v-model="configStore.config.freerdpPath" label="Path to freerdp" :type="'text'" />
    <v-text-field v-model="configStore.config.username" label="username" :type="'text'" />
    <v-combobox
      v-model="additionalProperties"
      chips
      clearable
      closable-chips
      hide-selected
      item-title="title"
      item-value="title"
      :items="suggestedItems"
      label="Additional properties"
      multiple
      variant="solo"
    >
      <template #chip="{ props, item }">
        <v-chip v-bind="props">
          <strong>{{ item.title }}</strong>&nbsp;
          <span>({{ item.props.description || "custom property" }})</span>
        </v-chip>
      </template>
    </v-combobox>
    <v-row justify="start">
      <v-col cols="2">
        <v-btn color="primary" width="100%" @click="save(true)">save</v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="save(false)">apply</v-btn>
      </v-col>
      <v-spacer />
      <v-col cols="2">
        <v-btn @click="reset()">reset</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { ListItem } from '@/types/list-item.ts';
  import { Store } from '@tauri-apps/plugin-store';
  import { onBeforeRouteLeave } from 'vue-router';
  import router from '@/router';
  import { useConfigStore } from '@/stores/config.ts';
  import { log } from '@/types/logger.ts';

  const configStore = useConfigStore();

  const suggestedItems: ListItem[] = [
    { title: '/gfx', props: { description: 'enables the RemoteFX / RDP8 graphics pipeline' } },
    { title: '/gfx:AVC444', props: { description: 'H.264/AVC in 4:4:4 chroma, sharp text' } },
    { title: '/gfx:progressive', props: { description: 'smoother redraws' } },
    { title: '/gdi:hw', props: { description: 'hardware acc.' } },
    { title: '-compression', props: { description: 'no compression (recommended when using /gfx)' } },
    { title: '/multitransport', props: { description: 'UDP-Support' } },
    { title: '/network:lan', props: { description: 'optimize for LAN (Enables high-quality codecs (RFX, AVC444))' } },
    { title: '/bpp:24', props: { description: 'color-depth (use 24 or 32)' } },
  ];

  const additionalProperties = ref<ListItem[]>([]);
  onMounted(async () => await init());

  onBeforeRouteLeave(async () => {
    await reset();
    return true;
  });

  function loadParams (params: string[]): ListItem[] {
    return params.map(p => {
      log('try match', p);
      return suggestedItems.find(s => s.title == p) || { title: p, props: { description: 'custom property' } };
    });
  }

  async function init () {
    additionalProperties.value = loadParams(configStore.config.connectionParams || []);
  }

  async function saveConfig () {
    configStore.config.connectionParams = additionalProperties.value.map((p: ListItem | string) =>
      typeof p === 'string' ? p : p.title || '',
    );
    log('save config', configStore.config);
    const store = await Store.load('settings1.json');
    await configStore.saveConfig(store);
  }

  async function save (close: boolean) {
    await saveConfig();
    if (close) {
      router.push('/main').then(_ => {});
    }
  }

  async function reset () {
    const store = await Store.load('settings1.json');
    await configStore.initConfig(store);
    await init();
  }

</script>
