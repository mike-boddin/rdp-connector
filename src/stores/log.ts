import { listen } from '@tauri-apps/api/event';
// Utilities
import { defineStore } from 'pinia';

export const useLogStore = defineStore('log-store', {
  state: () => ({
    log: '' as string,
    forbiddenLogs: [] as string[],
  }),
  getters: {},
  actions: {
    appendLog (msg: string) {
      if (this.shouldNotLog(msg)) {
        return;
      }
      this.log = msg.replace(/[\n\r]/gm, '') + '\n' + (this.log || '');
    },
    appendLogAsIs (msg: string) {
      if (this.shouldNotLog(msg)) {
        return;
      }
      this.log = msg + '\n' + (this.log || '');
    },
    clearLog () {
      this.log = '';
    },
    shouldNotLog (msg: string): boolean {
      return this.forbiddenLogs.some(forbiddenLog => msg.includes(forbiddenLog));
    },
    suppressLogsWith (msg: string) {
      this.forbiddenLogs.push(msg);
    },
  },
});
