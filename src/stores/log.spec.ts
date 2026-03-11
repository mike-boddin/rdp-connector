import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLogStore } from './log';

describe('Log Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should initialize with empty log', () => {
      const store = useLogStore();
      expect(store.log).toBe('');
    });

    it('should initialize with empty forbiddenLogs array', () => {
      const store = useLogStore();
      expect(store.forbiddenLogs).toEqual([]);
    });
  });

  describe('appendLog', () => {
    it('should append a simple message to the log', () => {
      const store = useLogStore();
      store.appendLog('Test message');
      expect(store.log).toBe('Test message\n');
    });

    it('should prepend new messages (newest first)', () => {
      const store = useLogStore();
      store.appendLog('First message');
      store.appendLog('Second message');
      expect(store.log).toBe('Second message\nFirst message\n');
    });

    it('should add prefix when provided', () => {
      const store = useLogStore();
      store.appendLog('Test message', 'INFO');
      expect(store.log).toBe('[INFO] Test message\n');
    });

    it('should strip newline characters from message', () => {
      const store = useLogStore();
      store.appendLog('Test\nmessage\r\nwith breaks');
      expect(store.log).toBe('Testmessagewith breaks\n');
    });

    it('should not log messages that match forbidden logs', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden');
      store.appendLog('This is forbidden');
      expect(store.log).toBe('');
    });

    it('should log messages that do not match forbidden logs', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden');
      store.appendLog('This is allowed');
      expect(store.log).toBe('This is allowed\n');
    });
  });

  describe('appendLogAsIs', () => {
    it('should append message as-is without prefix', () => {
      const store = useLogStore();
      store.appendLogAsIs('Test message');
      expect(store.log).toBe('Test message\n');
    });

    it('should prepend new messages (newest first)', () => {
      const store = useLogStore();
      store.appendLogAsIs('First message');
      store.appendLogAsIs('Second message');
      expect(store.log).toBe('Second message\nFirst message\n');
    });

    it('should preserve newlines in the message', () => {
      const store = useLogStore();
      store.appendLogAsIs('Test\nmessage');
      expect(store.log).toBe('Test\nmessage\n');
    });

    it('should not log messages that match forbidden logs', () => {
      const store = useLogStore();
      store.suppressLogsWith('secret');
      store.appendLogAsIs('This is secret');
      expect(store.log).toBe('');
    });
  });

  describe('clearLog', () => {
    it('should clear all logs', () => {
      const store = useLogStore();
      store.appendLog('Test message 1');
      store.appendLog('Test message 2');
      expect(store.log).not.toBe('');

      store.clearLog();
      expect(store.log).toBe('');
    });

    it('should not affect forbiddenLogs', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden');
      store.clearLog();
      expect(store.forbiddenLogs).toEqual(['forbidden']);
    });
  });

  describe('shouldNotLog', () => {
    it('should return false when forbiddenLogs is empty', () => {
      const store = useLogStore();
      expect(store.shouldNotLog('any message')).toBe(false);
    });

    it('should return true when message matches forbidden log exactly', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden message');
      expect(store.shouldNotLog('forbidden message')).toBe(true);
    });

    it('should return true when forbidden log contains the message', () => {
      const store = useLogStore();
      store.suppressLogsWith('This contains forbidden text');
      expect(store.shouldNotLog('forbidden')).toBe(true);
    });

    it('should return false when message does not match any forbidden log', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden');
      expect(store.shouldNotLog('allowed')).toBe(false);
    });

    it('should handle multiple forbidden logs', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden1');
      store.suppressLogsWith('forbidden2');

      expect(store.shouldNotLog('forbidden1')).toBe(true);
      expect(store.shouldNotLog('forbidden2')).toBe(true);
      expect(store.shouldNotLog('allowed')).toBe(false);
    });
  });

  describe('suppressLogsWith', () => {
    it('should add message to forbiddenLogs', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden');
      expect(store.forbiddenLogs).toContain('forbidden');
    });

    it('should not add duplicate messages', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden');
      store.suppressLogsWith('forbidden');
      expect(store.forbiddenLogs).toEqual(['forbidden']);
    });

    it('should allow multiple different forbidden messages', () => {
      const store = useLogStore();
      store.suppressLogsWith('forbidden1');
      store.suppressLogsWith('forbidden2');
      expect(store.forbiddenLogs).toEqual(['forbidden1', 'forbidden2']);
    });
  });

  describe('integration tests', () => {
    it('should handle complex logging scenario', () => {
      const store = useLogStore();

      store.appendLog('First log');
      store.appendLog('Second log', 'INFO');
      store.suppressLogsWith('secret');
      store.appendLog('This is secret'); // Should not be logged
      store.appendLog('Third log');

      const expected = 'Third log\n[INFO] Second log\nFirst log\n';
      expect(store.log).toBe(expected);
    });

    it('should clear logs but maintain forbidden list', () => {
      const store = useLogStore();

      store.appendLog('Message 1');
      store.suppressLogsWith('forbidden');
      store.clearLog();
      store.appendLog('This is forbidden'); // Should not be logged
      store.appendLog('Allowed message');

      expect(store.log).toBe('Allowed message\n');
    });

    it('should handle mixed appendLog and appendLogAsIs calls', () => {
      const store = useLogStore();

      store.appendLog('Formatted message', 'DEBUG');
      store.appendLogAsIs('Raw message');

      expect(store.log).toBe('Raw message\n[DEBUG] Formatted message\n');
    });
  });
});
