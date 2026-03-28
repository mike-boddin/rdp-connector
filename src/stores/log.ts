import { defineStore } from 'pinia';
import { log } from '@/types/logger.ts';

export const useLogStore = defineStore('log-store', {
  state: () => ({
    log: '' as string,
    rawLog: '' as string,
    forbiddenLogs: [] as string[],
  }),
  getters: {},
  actions: {
    appendLog (msg: string, prefix = '') {
      const rawMsg = msg;
      msg = msg.replace(/[\n\r]/gm, '');
      log('appendLog', msg);
      if (this.shouldNotLog(msg)) {
        log('SKIP', msg);
        return;
      }
      this.rawLog += rawMsg + '\n';
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
      this.rawLog += msg + '\n';
      this.log = msg + '\n' + (this.log || '');
    },
    clearLog () {
      this.log = '';
      this.rawLog = '';
    },
    shouldNotLog (msg: string): boolean {
      if (this.forbiddenLogs.length > 0) {
        log('check against forbiddenLogs', this.forbiddenLogs);
      }
      return this.forbiddenLogs.some(forbiddenLog => msg.includes(forbiddenLog) || forbiddenLog.includes(msg));
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
