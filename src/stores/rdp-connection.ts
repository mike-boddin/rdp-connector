import { listen, type UnlistenFn } from '@tauri-apps/api/event';
// Utilities
import { defineStore } from 'pinia';
import { useLogStore } from '@/stores/log.ts';

export const useRdpConnectionStore = defineStore('rdp-connection-store', {
  state: () => ({
    oauthWaiter: undefined as UnlistenFn | undefined,
    waitingForOauthResult: false,
  }),
  getters: {
    logStore: () => useLogStore(),
  },
  actions: {
    async listenForOauthClosed () {
      this.oauthWaiter = await listen<string>('oauth-closed', async event => {
        if (this.waitingForOauthResult) {
          this.logStore.appendLog(`oauth window unexpectedly closed`);
          clearInterval(oauthWaiterIntervalId);
          await stopPty();
        }
      });
    },
  },
});
