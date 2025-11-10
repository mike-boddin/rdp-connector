import { defineStore } from 'pinia';
import { log } from '@/types/logger.ts';

export const useLogStore = defineStore('log-store', {
  state: () => ({
    log: '' as string,
    forbiddenLogs: [] as string[],
  }),
  getters: {},
  actions: {
    appendLog (msg: string, prefix = '') {
      msg = msg.replace(/[\n\r]/gm, '');
      log('appendLog', msg);
      if (this.shouldNotLog(msg)) {
        log('SKIP', msg);
        return;
      }
      const pfx = prefix == '' ? '' : `[${prefix}] `;
      const message = `${pfx}` + msg;
      this.log = message + '\n' + (this.log || '');
    },
    appendLogAsIs (msg: string) {
      log('appendLogAsIs', msg);
      if (this.shouldNotLog(msg)) {
        log('SKIP', msg);
        return;
      }
      this.log = msg + '\n' + (this.log || '');
    },
    clearLog () {
      this.log = '';
    },
    shouldNotLog (msg: string): boolean {
      if (this.forbiddenLogs.length > 0) {
        log('check against forbiddenLogs', this.forbiddenLogs);
      }
      return this.forbiddenLogs.some(forbiddenLog => forbiddenLog.includes(msg));
    },
    suppressLogsWith (msg: string) {
      log('suppressLogsWith', msg);
      if (this.forbiddenLogs.includes(msg)) {
        return;
      }
      this.forbiddenLogs.push(msg);
    },
  },
});
