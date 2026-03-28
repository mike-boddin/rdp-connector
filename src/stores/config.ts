import type { Store } from '@tauri-apps/plugin-store';
// Utilities
import { defineStore } from 'pinia';
import { useLogStore } from '@/stores/log.ts';
import {
  clone,
  type IConfigListEntry,
  type IConnectionConfig,
  isConfigValid,
  printConfig,
} from '@/types/connection-config.ts';

export const useConfigStore = defineStore('config-store', {
  state: () => ({
    configs: [] as IConfigListEntry[],
    selectedIndex: 0,
    showLogo: true,
  }),
  getters: {
    config (state): IConnectionConfig {
      return state.configs[state.selectedIndex]!.config;
    },
    configTitle (state): string {
      return state.configs[state.selectedIndex]?.title || '';
    },
    configIsValid (_state): boolean {
      return this.config != undefined && isConfigValid(this.config);
    },
  },
  actions: {
    async initConfig (store: Store) {
      const logStore = useLogStore();

      this.configs = (await store.get<IConfigListEntry[]>('configs')) || [];
      this.selectedIndex = (await store.get<number>('selectedIndex')) || 0;
      this.showLogo = (await store.get<boolean>('showLogo')) ?? true;

      if (this.configs.length === 0) {
        const oldConfig = await store.get<IConnectionConfig>('config');
        if (oldConfig) {
          this.configs.push({
            title: 'Default Config',
            config: oldConfig,
          });
        }
      }

      if (this.configs.length === 0) {
        this.configs.push({
          title: 'Default Config',
          config: { username: '', connectionParams: [], freerdpPath: '', rdpFile: '' },
        });
      }

      logStore.appendLogAsIs('configs loaded: ' + this.configs.length);
      if (this.selectedIndex >= this.configs.length) {
        this.selectedIndex = 0;
      }
      if (this.config) {
        logStore.appendLogAsIs(`current config: ${this.configTitle}\n` + printConfig(this.config));
        if (!isConfigValid(this.config)) {
          logStore.appendLog('please setup all values!');
        }
      }
    },
    async addConfig () {
      let title = 'New Config';
      let i = 1;
      while (this.configs.some(c => c.title === title)) {
        title = `New Config (${i++})`;
      }
      this.configs.push({
        title,
        config: { username: '', connectionParams: [], freerdpPath: '', rdpFile: '' },
      });
      this.selectedIndex = this.configs.length - 1;
    },
    async cloneConfig (index: number) {
      const sourceEntry = this.configs[index];
      if (!sourceEntry) {
        return;
      }

      let title = `${sourceEntry.title} (Copy)`;
      let i = 1;
      while (this.configs.some(c => c.title === title)) {
        title = `${sourceEntry.title} (Copy ${i++})`;
      }

      this.configs.push({
        title,
        config: clone(sourceEntry.config),
      });
      this.selectedIndex = this.configs.length - 1;
    },
    async deleteConfig (index: number) {
      if (this.configs.length > 1) {
        this.configs.splice(index, 1);
        if (this.selectedIndex >= this.configs.length) {
          this.selectedIndex = this.configs.length - 1;
        }
      }
    },
    async saveConfig (store: Store, silent = false) {
      await store.set('configs', this.configs);
      await store.set('selectedIndex', this.selectedIndex);
      await store.set('showLogo', this.showLogo);
      await store.save();
      if (!silent) {
        const logStore = useLogStore();
        logStore.appendLogAsIs('configs saved: ' + this.configs.length);
      }
    },
  },
});
