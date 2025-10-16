import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
// Utilities
import { defineStore } from 'pinia';
import { useLogStore } from '@/stores/log.ts';

export const useRdpConnectionStore = defineStore('rdp-connection-store', {
  state: () => ({
    oauthWaiter: undefined as UnlistenFn | undefined,
    waitingForOauthResult: false,
    oauthWaiterIntervalId: undefined as number | undefined,
    firstTimeOauth: true,
  }),
  getters: {
    processIsRunning (state) {
      return false;
    },

  },
  actions: {
    async init () {
      await this.listenForOauthClosed();
      await this.listenForPtyResult();
    },
    async listenForOauthClosed () {
      if (this.oauthWaiter != undefined) {
        return;
      }
      const logStore = useLogStore();
      this.oauthWaiter = await listen<string>('oauth-closed', async event => {
        if (this.waitingForOauthResult) {
          logStore.appendLog(`oauth window unexpectedly closed`);
          clearInterval(this.oauthWaiterIntervalId);
          await invoke('stop_pty');
          logStore.appendLog('Process stopped');
        }
      });
    },
    async listenForPtyResult () {
      const logStore = useLogStore();
      await listen<string>('pty-output', async event => {
        if (event.payload.includes('https') && !event.payload.includes('code=')) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const matches: string[] = event.payload.match(urlRegex) || [];
          if (matches.length > 0) {
            logStore.appendLog(this.firstTimeOauth ? 'oauth-flow detected' : 'almost there...');
            this.firstTimeOauth = false;
            await this.initOAuthListener(matches[0]);
          }
        } else if (!event.payload.includes('https')) {
          logStore.appendLog('[RDP] ' + event.payload);
        }
        if (event.payload.includes('ERRCONNECT_CONNECT_CANCELLED')) {
          await invoke('stop_pty');
        }
      });
    },
    async startRdp (retryCount = 0) {
      const logStore = useLogStore();
      if (retryCount == 3) {
        logStore.appendLog('stop trying after 3 startup-failures');
        return;
      }
      logStore.clearLog();
      logStore.appendLog('Process started..');
      const times = 0;

      try {
        await startRdpProcess();
      } catch (error) {
        retryCount = retryCount + 1;
        console.error(error);
        if (error) {
          logStore.appendLog(error.toString());
        }
        await stopPty();
        stopListening();
        await startRdp(retryCount);
      }
    },
    /**
     * starts the oauth-flow in a seperate window and polls for the redirect-url
     * sends the redirect url to the rdp-prcoess afterward
     * @param url
     */
    async initOAuthListener (url: string | undefined) {
      if (!url) {
        return;
      }
      const logStore = useLogStore();
      await invoke('open_oauth_window', { url });
      this.waitingForOauthResult = true;

      this.oauthWaiterIntervalId = setInterval(async () => {
        const currentUrlOfOauthFlow: string = await invoke('read_oauth_url');

        if (currentUrlOfOauthFlow.includes('code=')) {
          this.waitingForOauthResult = false;
          logStore.suppressLogsWith(currentUrlOfOauthFlow);
          logStore.appendLog('send oauth code to freerdp process');
          clearInterval(this.oauthWaiterIntervalId);
          await invoke('close_oauth_window');
          await invoke('send_pty_input', { input: currentUrlOfOauthFlow });
          return;
        }
      }, 300);
    },
  },
});
