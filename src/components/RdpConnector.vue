<template>
  <v-container>
    <v-row no-gutters>
      <v-col align-self="stretch">
        <v-btn :disabled="!configIsValid()" width="100%" @click="startRdp(0)">start RDP</v-btn>
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
  import { invoke } from '@tauri-apps/api/core';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { Store } from '@tauri-apps/plugin-store';
  import { useLogStore } from '@/stores/log.ts';
  import { type IConnectionConfig, isConfigValid, printConfig } from '@/types/connection-config.ts';

  // fields
  const logStore = useLogStore();
  const store = await Store.load('settings1.json');
  let unlisten: UnlistenFn | undefined;
  let invalidLogs: string[] = [];
  let oauthWaiterIntervalId: number;
  let waitingForOauthResult: boolean;
  const config = defineModel<IConnectionConfig>('config');
  const configIsValid = () => isConfigValid(config.value);

  // startup
  onMounted(async () => {
    await startOauthFailureObserver();
    await initConfig();
  });

  // functions
  async function initConfig () {
    config.value = (await store.get<IConnectionConfig>('config'));
    logStore.appendLogAsIs('config loaded:\n' + printConfig(config.value));
    if (!configIsValid()) {
      logStore.appendLog('please setup all values!');
    }
  }

  function shouldNotLog (txt: string) {
    return (invalidLogs.some(x => x.includes(txt.replace(/[\t\n\r]/gm, ''))));
  }

  function stopListening () {
    if (!unlisten) {
      return;
    }
    invalidLogs = [];
    unlisten();
    unlisten = undefined;
  }

  async function startRdp (retryCount = 0) {
    if (retryCount == 3) {
      logStore.appendLog('stop trying after 3 startup-failures');
      return;
    }
    stopListening();
    startLog('Process started..');
    let times = 0;
    unlisten = await listen<string>('pty-output', async event => {
      if (event.payload.includes('https') && !event.payload.includes('code=')) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches: string[] = event.payload.match(urlRegex) || [];
        if (matches.length > 0) {
          logStore.appendLog(times == 0 ? 'oauth-flow detected' : 'almost there...');
          times++;
          await initOAuthListener(matches[0]);
        }
      } else if (!event.payload.includes('https') && !shouldNotLog(event.payload)) {
        logStore.appendLog('[RDP] ' + event.payload);
      }
      if (event.payload.includes('ERRCONNECT_CONNECT_CANCELLED')) {
        await stopPty();
        stopListening();
      }
    });

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
  }

  function startLog (msg: string) {
    logStore.clearLog();
    logStore.appendLog(msg);
  }

  async function stopPty () {
    await invoke('stop_pty');
    logStore.appendLog('Process stopped');
  }

  async function startRdpProcess () {
    const prog = config.value?.freerdpPath;
    const params = [config.value?.rdpFile, ...(config.value?.connectionParams || [])];
    if (config?.value?.username) {
      params.push(`/u:${config.value?.username}`);
    }
    startLog('FreeRDP Process started..');
    logStore.appendLog(`${prog} ` + params.join(' '));
    await invoke('start_pty', {
      program: prog,
      args: params,
    });
  }

  /**
   * starts the oauth-flow in a seperate window and polls for the redirect-url
   * sends the redirect url to the rdp-prcoess afterward
   * @param url
   */
  async function initOAuthListener (url: string | undefined) {
    if (!url) {
      return;
    }
    await invoke('open_oauth_window', { url: url });
    waitingForOauthResult = true;

    oauthWaiterIntervalId = setInterval(async () => {
      const currentUrlOfOauthFlow: string = await invoke('read_oauth_url');

      if (currentUrlOfOauthFlow.includes('code=')) {
        waitingForOauthResult = false;
        invalidLogs.push(currentUrlOfOauthFlow);
        logStore.appendLog('send oauth code to freerdp process');
        clearInterval(oauthWaiterIntervalId);
        await invoke('close_oauth_window');
        await invoke('send_pty_input', { input: currentUrlOfOauthFlow });
        return;
      }
    }, 300);
  }

  async function startOauthFailureObserver () {
    const oauthWaiter = await listen<string>('oauth-closed', async event => {
      if (waitingForOauthResult) {
        logStore.appendLog(`oauth window unexpectedly closed`);
        clearInterval(oauthWaiterIntervalId);
        await stopPty();
      }
    });
  }

</script>
<style scoped>
::v-deep(.my-full-height-textarea) textarea {
  height: calc(100vh - 300px); /* Adjust as needed */
  overflow-y: auto;
}
</style>
