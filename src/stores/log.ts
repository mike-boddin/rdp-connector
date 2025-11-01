import { defineStore } from 'pinia';

export const useLogStore = defineStore('log-store', {
  state: () => ({
    log: '' as string,
    forbiddenLogs: [] as string[],
  }),
  getters: {},
  actions: {
    appendLog (msg: string, prefix = '') {
      if (this.shouldNotLog(msg)) {
        return;
      }
      const pfx = prefix == '' ? '' : `[${prefix}] `;
      const message = `${pfx}` + msg.replace(/[\n\r]/gm, '');
      this.log = message + '\n' + (this.log || '');
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
      return this.forbiddenLogs.some(forbiddenLog => forbiddenLog.includes(msg));
    },
    suppressLogsWith (msg: string) {
      this.forbiddenLogs.push(msg);
    },
  },
});
