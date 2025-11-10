import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
// Utilities
import { defineStore } from 'pinia';
import { useConfigStore } from '@/stores/config.ts';
import { useLogStore } from '@/stores/log.ts';

export const useRdpConnectionStore = defineStore('rdp-connection-store', {
  state: () => ({
    oauthWaiter: undefined as UnlistenFn | undefined,
    waitingForOauthResult: false,
    oauthWaiterIntervalId: undefined as number | undefined,
    firstTimeOauth: true,
    processIsRunning: false,
    errorStates: ['Failed to connect', 'ERRCONNECT_CONNECT_CANCELLED'],
  }),
  getters: {},
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
      this.oauthWaiter = await listen<string>('oauth-closed', async () => {
        if (this.waitingForOauthResult) {
          logStore.appendLog(`oauth window unexpectedly closed`);
          await this.stopWaitingForOauthResult();
          await this.stopPty();
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
            await this.startWaitingForOauthResult(matches[0]);
          }
        } else if (!event.payload.includes('https')) {
          logStore.appendLog(event.payload, 'RDP');
        }
        if (this.errorStates.some(err => event.payload.includes(err))) {
          await this.stopPty();
        }
      });
    },
    async toggleRdp () {
      if (this.processIsRunning) {
        await this.stopWaitingForOauthResult();
        await this.stopPty();
      } else {
        await this.startRdp();
      }
    },
    async startRdp (retryCount = 0) {
      this.firstTimeOauth = true;
      const logStore = useLogStore();

      if (retryCount == 3) {
        logStore.appendLog('stop trying after 3 startup-failures');
        return;
      }
      logStore.clearLog();
      logStore.appendLog('Process started..');
      try {
        await this.startPty();
      } catch (error) {
        retryCount = retryCount + 1;
        console.error(error);
        if (error) {
          logStore.appendLog(error.toString());
        }
        await this.stopPty();
        await this.startRdp(retryCount);
      }
    },
    /**
     * starts the oauth-flow in a seperate window and polls for the redirect-url
     * sends the redirect url to the rdp-prcoess afterward
     * @param url
     */
    async startWaitingForOauthResult (url: string | undefined) {
      if (!url) {
        return;
      }
      const logStore = useLogStore();
      await invoke('open_oauth_window', { url });
      this.waitingForOauthResult = true;

      this.oauthWaiterIntervalId = setInterval(async () => {
        const currentUrlOfOauthFlow: string = await invoke('read_oauth_url');

        if (currentUrlOfOauthFlow.includes('code=')) {
          logStore.suppressLogsWith(currentUrlOfOauthFlow);
          logStore.appendLog('send oauth code to freerdp process');
          await this.stopWaitingForOauthResult();
          await invoke('send_pty_input', { input: currentUrlOfOauthFlow });
          return;
        }
      }, 300);
    },
    async stopWaitingForOauthResult () {
      this.waitingForOauthResult = false;
      clearInterval(this.oauthWaiterIntervalId);
      await invoke('close_oauth_window');
    },
    async startPty () {
      const configStore = useConfigStore();
      const logStore = useLogStore();
      const prog = configStore.config?.freerdpPath;
      const params = [configStore.config?.rdpFile, ...(configStore.config?.connectionParams || [])];
      if (configStore.config?.username) {
        params.push(`/u:${configStore.config?.username}`);
      }
      logStore.clearLog();
      logStore.appendLog('FreeRDP Process started..');
      logStore.appendLog(`${prog} ` + params.join(' '));
      await invoke('start_pty', {
        program: prog,
        args: params,
      });
      this.processIsRunning = true;
    },
    async stopPty () {
      const logStore = useLogStore();
      await invoke('stop_pty');
      logStore.appendLog('Process stopped');
      this.processIsRunning = false;
    },
  },
});
