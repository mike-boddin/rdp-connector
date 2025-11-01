import type { Store } from '@tauri-apps/plugin-store';
// Utilities
import { defineStore } from 'pinia';
import { useLogStore } from '@/stores/log.ts';
import { type IConnectionConfig, isConfigValid, printConfig } from '@/types/connection-config.ts';

export const useConfigStore = defineStore('config-store', {
  state: () => ({
    config: undefined as IConnectionConfig | undefined,
  }),
  getters: {
    configIsValid (): boolean {
      return this.config != undefined && isConfigValid(this.config);
    },
  },
  actions: {
    async initConfig (store: Store) {
      const logStore = useLogStore();

      this.config = (await store.get<IConnectionConfig>('config'));
      logStore.appendLogAsIs('config loaded:\n' + printConfig(this.config));
      if (!isConfigValid(this.config)) {
        logStore.appendLog('please setup all values!');
      }
    },
  },
});
