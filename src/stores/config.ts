import type { Store } from '@tauri-apps/plugin-store';
// Utilities
import { defineStore } from 'pinia';
import { useLogStore } from '@/stores/log.ts';
import { type IConnectionConfig, isConfigValid, printConfig } from '@/types/connection-config.ts';

export const useConfigStore = defineStore('config-store', {
  state: () => ({
    config: { username: '', connectionParams: [], freerdpPath: '', rdpFile: '' } as IConnectionConfig,
  }),
  getters: {
    configIsValid (): boolean {
      return this.config != undefined && isConfigValid(this.config);
    },
  },
  actions: {
    async initConfig (store: Store) {
      const logStore = useLogStore();

      this.config = (await store.get<IConnectionConfig>('config')) || { username: '', connectionParams: [], freerdpPath: '', rdpFile: '' };
      logStore.appendLogAsIs('config loaded:\n' + printConfig(this.config));
      if (!isConfigValid(this.config)) {
        logStore.appendLog('please setup all values!');
      }
    },
    async saveConfig (store: Store) {
      const logStore = useLogStore();
      await store.set('config', this.config);
      await store.save();
      logStore.appendLogAsIs('config saved:\n' + printConfig(this.config));
    },
  },
});
