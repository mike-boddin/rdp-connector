import { listen } from '@tauri-apps/api/event';
// Utilities
import { defineStore } from 'pinia';

export const useLogStore = defineStore('log-store', {
  state: () => ({
    log: '' as string,
  }),
  getters: {},
  actions: {
    appendLog (msg: string) {
      this.log = msg.replace(/[\n\r]/gm, '') + '\n' + (this.log || '');
    },
    appendLogAsIs (msg: string) {
      this.log = msg + '\n' + (this.log || '');
    },
    clearLog () {
      this.log = '';
    },
  },
});
