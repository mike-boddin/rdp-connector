<template>
  <v-container>
    <v-text-field
      v-model="configStore.configs[configStore.selectedIndex]!.title"
      label="Config Title"
      :rules="[v => !!v || 'Title is required', v => !isDuplicateTitle(v) || 'Title must be unique']"
      :type="'text'"
    />

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
          <strong>{{ item.title || item }}</strong>&nbsp;
          <span>({{ item.props?.description || "custom property" }})</span>
        </v-chip>
      </template>

      <template #item="{ props, item }">
        <v-list-item v-bind="props" :subtitle="item.props?.description || 'custom property'" />
      </template>
    </v-combobox>

    <v-row align="center" justify="start">
      <v-col cols="2">
        <v-btn color="primary" width="100%" @click="save(true)">save</v-btn>
      </v-col>

      <v-col cols="2">
        <v-btn @click="save(false)">apply</v-btn>
      </v-col>

      <v-col cols="auto">
        <v-btn
          color="success"
          icon
          size="small"
          variant="tonal"
          @click="add()"
        >
          <v-icon>mdi-plus</v-icon>
          <v-tooltip activator="parent" location="top">Add config</v-tooltip>
        </v-btn>
      </v-col>

      <v-col cols="auto">
        <v-btn
          color="info"
          icon
          size="small"
          variant="tonal"
          @click="clone()"
        >
          <v-icon>mdi-content-copy</v-icon>
          <v-tooltip activator="parent" location="top">Clone config</v-tooltip>
        </v-btn>
      </v-col>

      <v-col cols="auto">
        <v-btn
          color="error"
          :disabled="configStore.configs.length <= 1"
          icon
          size="small"
          variant="tonal"
          @click="showConfirmDelete = true"
        >
          <v-icon>mdi-minus</v-icon>
          <v-tooltip activator="parent" location="top">Delete config</v-tooltip>
        </v-btn>
      </v-col>

      <v-spacer />

      <v-col cols="2">
        <v-btn @click="reset()">reset</v-btn>
      </v-col>
    </v-row>

    <v-dialog v-model="showConfirmDelete" max-width="500">
      <v-card title="Confirm Delete">
        <v-card-text>
          Are you sure you want to delete the config "{{ configStore.configTitle }}"?
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showConfirmDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
  const showConfirmDelete = ref(false);

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

  watch(() => configStore.selectedIndex, async () => {
    await init();
  });

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
    if (configStore.config) {
      additionalProperties.value = loadParams(configStore.config.connectionParams || []);
    }
  }

  async function saveConfig (): Promise<boolean> {
    if (configStore.config) {
      const title = configStore.configTitle;
      if (!title || isDuplicateTitle(title)) {
        return false;
      }
      configStore.config.connectionParams = additionalProperties.value.map((p: ListItem | string) =>
        typeof p === 'string' ? p : p.title || '',
      );
      log('save config', configStore.config);
      const store = await Store.load('settings1.json');
      await configStore.saveConfig(store);
      return true;
    }
    return false;
  }

  async function save (close: boolean) {
    if (await saveConfig() && close) {
      router.push('/main').then(_ => {});
    }
  }

  async function add () {
    await configStore.addConfig();
    await init();
  }

  async function clone () {
    await configStore.cloneConfig(configStore.selectedIndex);
    await init();
  }

  async function remove () {
    await configStore.deleteConfig(configStore.selectedIndex);
    await init();
  }

  async function confirmDelete () {
    showConfirmDelete.value = false;
    await remove();
  }

  function isDuplicateTitle (title: string): boolean {
    return configStore.configs.some((c, index) => c.title === title && index !== configStore.selectedIndex);
  }

  async function reset () {
    const store = await Store.load('settings1.json');
    await configStore.initConfig(store);
    await init();
  }

</script>
