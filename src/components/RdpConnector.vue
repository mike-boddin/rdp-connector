<template>
  <v-container>
    <v-row no-gutters>
      <v-col align-self="stretch">
        <v-btn :disabled="!configStore.configIsValid" width="100%" @click="startRdp()">start RDP</v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="fill-height">
    <v-row no-gutters>
      <v-col align-self="stretch">
        <v-textarea
          v-model="logStore.log"
          class="my-full-height-textarea"
          glow
          rows="1"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
  import { useConfigStore } from '@/stores/config.ts';
  import { useLogStore } from '@/stores/log.ts';
  import { useRdpConnectionStore } from '@/stores/rdp-connection.ts';

  // fields
  const logStore = useLogStore();
  const rdpStore = useRdpConnectionStore();
  const configStore = useConfigStore();

  // startup
  onMounted(async () => {});

  // functions

  async function startRdp () {
    await rdpStore.startRdp();
  }

</script>
<style scoped>
::v-deep(.my-full-height-textarea) textarea {
  height: calc(100vh - 300px); /* Adjust as needed */
  overflow-y: auto;
}
</style>
