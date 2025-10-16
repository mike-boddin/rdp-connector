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
  import router from '@/router/index.js';
  import { useRdpConnectionStore } from '@/stores/rdp-connection.ts';

  const rdpStore = useRdpConnectionStore();

  onMounted(async () => {
    await rdpStore.init();
    goToHome();
  });

  function goToHome () {
    router.push('/main');
  }

</script>
