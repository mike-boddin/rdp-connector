<template>
  <v-container class="pb-0">
    <v-row no-gutters>
      <v-col align-self="stretch">
        <v-btn :active="rdpStore.processIsRunning" :disabled="!configStore.configIsValid" width="100%" @click="rdpStore.toggleRdp()">
          {{ buttonText }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="fill-height">
    <v-row no-gutters>
      <v-col align-self="stretch">
        <v-card class="w-100">
          <v-toolbar color="" density="compact" flat>
            <v-toolbar-title class="text-caption ml-2" />
            <v-spacer />
            <v-btn
              v-if="!configStore.showLogo"
              icon
              size="x-small"
              variant="plain"
              @click="copyRawLog"
            >
              <v-icon>mdi-content-copy</v-icon>
              <v-tooltip activator="parent" location="top">Copy Log To Clipboard</v-tooltip>
            </v-btn>
            <v-btn
              v-if="!configStore.showLogo"
              icon
              size="x-small"
              variant="plain"
              @click="clearLog"
            >
              <v-icon>mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">Clear Log</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="x-small"
              variant="plain"
              @click="toggleLogo"
            >
              <v-icon>{{ configStore.showLogo ? 'mdi-text-box-outline' : 'mdi-image-outline' }}</v-icon>
              <v-tooltip activator="parent" location="top">{{ configStore.showLogo ? 'Show Log' : 'Hide Log' }}</v-tooltip>
            </v-btn>
          </v-toolbar>
          <v-textarea
            v-if="!configStore.showLogo"
            v-model="logStore.log"
            class="my-full-height-textarea"
            hide-details
            readonly
            rows="1"
            variant="solo"
          />
          <div v-else class="my-full-height-logo-container d-flex align-center justify-center">
            <v-img max-height="100%" max-width="100%" :src="logo" style="filter: grayscale(100%);" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
  import { Store } from '@tauri-apps/plugin-store';
  import logo from '@/assets/rdp-connector-icon-light.svg';
  import { useConfigStore } from '@/stores/config.ts';
  import { useLogStore } from '@/stores/log.ts';
  import { useRdpConnectionStore } from '@/stores/rdp-connection.ts';

  // fields
  const logStore = useLogStore();
  const rdpStore = useRdpConnectionStore();
  const configStore = useConfigStore();

  function copyRawLog () {
    navigator.clipboard.writeText(logStore.rawLog);
  }

  function clearLog () {
    logStore.clearLog();
  }

  async function toggleLogo () {
    configStore.showLogo = !configStore.showLogo;
    const store = await Store.load('settings1.json');
    await configStore.saveConfig(store, true);
  }

  const buttonText = computed(() => {
    return rdpStore.processIsRunning ? 'Stop RDP' : 'Start RDP';
  });

  // startup
  onMounted(async () => {});

</script>
<style scoped>
::v-deep(.my-full-height-textarea) textarea {
  height: calc(100vh - 350px); /* Adjust as needed */
  overflow-y: auto;
}
.my-full-height-logo-container {
  height: calc(100vh - 350px);
}
</style>
