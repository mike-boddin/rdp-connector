<template>
  <v-layout>
    <v-app-bar>
      <v-btn
        class="text-none me-2"
        height="48"
        icon
        slim
        title="Main"
        to="/main"
      >
        <v-icon>mdi-microsoft-windows</v-icon>
      </v-btn>
      <v-app-bar-title style="cursor: pointer;" @click="goToHome">RDP Connector</v-app-bar-title>

      <template #append>
        <v-btn
          v-if="rdpStore.processIsRunning"
          class="text-none me-2"
          height="48"
          icon
          slim
          title="Jump to RDP Session"
          @click="rdpStore.focusRdp()"
        >
          <v-icon>mdi-monitor-arrow-down-variant</v-icon>
        </v-btn>
        <SettingsChooser />
        <v-btn
          class="text-none me-2"
          height="48"
          icon
          link
          slim
          title="Settings"
          to="/settings"
        >
          <v-icon>mdi-cog-outline</v-icon>

        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
  import { Store } from '@tauri-apps/plugin-store';
  import router from '@/router/index.js';
  import { useConfigStore } from '@/stores/config.ts';
  import { useRdpConnectionStore } from '@/stores/rdp-connection.ts';

  const rdpStore = useRdpConnectionStore();
  const configStore = useConfigStore();

  onMounted(async () => {
    const store = await Store.load('settings1.json');
    await configStore.initConfig(store);
    await rdpStore.init();
    goToHome();
  });

  function goToHome () {
    router.push('/main');
  }

</script>
