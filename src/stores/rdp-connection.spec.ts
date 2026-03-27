import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfigStore } from './config';
import { useLogStore } from './log';
import { useRdpConnectionStore } from './rdp-connection';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('RDP Connection Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const store = useRdpConnectionStore();
      expect(store.waitingForOauthResult).toBe(false);
      expect(store.processIsRunning).toBe(false);
    });
  });

  describe('init', () => {
    it('initializes listeners', async () => {
      const store = useRdpConnectionStore();
      const unlistenMock = vi.fn();
      (listen as any).mockResolvedValue(unlistenMock);

      await store.init();

      expect(listen).toHaveBeenCalledWith('oauth-closed', expect.any(Function));
      expect(listen).toHaveBeenCalledWith('pty-output', expect.any(Function));
      expect(store.oauthWaiter).toBe(unlistenMock);
    });
  });

  describe('startRdp', () => {
    it('starts RDP process', async () => {
      const store = useRdpConnectionStore();
      const configStore = useConfigStore();
      const logStore = useLogStore();

      configStore.configs = [{
        title: 'Test',
        config: { rdpFile: 'test.rdp', freerdpPath: 'freerdp', username: 'user', connectionParams: ['/v:server'] },
      }];
      configStore.selectedIndex = 0;

      await store.startRdp();

      expect(invoke).toHaveBeenCalledWith('start_pty', {
        program: 'freerdp',
        args: ['test.rdp', '/v:server', '/u:user'],
      });
      expect(store.processIsRunning).toBe(true);
      expect(logStore.log).toContain('FreeRDP Process started..');
    });
  });

  describe('stopPty', () => {
    it('stops RDP process', async () => {
      const store = useRdpConnectionStore();
      store.processIsRunning = true;

      await store.stopPty();

      expect(invoke).toHaveBeenCalledWith('stop_pty');
      expect(store.processIsRunning).toBe(false);
    });
  });

  describe('listenForPtyResult', () => {
    it('handles PTY output with OAuth URL', async () => {
      const store = useRdpConnectionStore();
      const logStore = useLogStore();

      // Simulate listen being called during init
      let ptyHandler: any;
      (listen as any).mockImplementation((event: string, handler: any) => {
        if (event === 'pty-output') {
          ptyHandler = handler;
        }
        return Promise.resolve(vi.fn());
      });

      await store.listenForPtyResult();

      // Simulate OAuth URL in PTY output
      const oauthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?state=...';
      await ptyHandler({ payload: `Please open ${oauthUrl}` });

      expect(logStore.log).toContain('oauth-flow detected');
      expect(invoke).toHaveBeenCalledWith('open_oauth_window', { url: oauthUrl });
      expect(store.waitingForOauthResult).toBe(true);
    });
  });

  describe('startWaitingForOauthResult', () => {
    it('polls for OAuth URL and sends code', async () => {
      const store = useRdpConnectionStore();
      const logStore = useLogStore();

      (invoke as any).mockImplementation((cmd: string) => {
        if (cmd === 'read_oauth_url') {
          return Promise.resolve('https://localhost/?code=123');
        }
        return Promise.resolve();
      });

      await store.startWaitingForOauthResult('https://auth.url');

      // The new code checks immediately. Since mock returns code immediately, it's already false.
      expect(store.waitingForOauthResult).toBe(false);

      expect(invoke).toHaveBeenCalledWith('read_oauth_url');
      expect(invoke).toHaveBeenCalledWith('send_pty_input', { input: 'https://localhost/?code=123' });
      expect(logStore.log).toContain('send oauth code to freerdp process');
    });

    it('polls for OAuth URL and sends code after interval', async () => {
      const store = useRdpConnectionStore();
      const logStore = useLogStore();

      (invoke as any).mockImplementation((cmd: string) => {
        if (cmd === 'read_oauth_url') {
          const callCount = (invoke as any).mock.calls.filter((c: any) => c[0] === 'read_oauth_url').length;
          if (callCount === 1) {
            return Promise.resolve('https://login.microsoftonline.com/');
          }
          return Promise.resolve('https://localhost/?code=123');
        }
        return Promise.resolve();
      });

      await store.startWaitingForOauthResult('https://auth.url');

      expect(store.waitingForOauthResult).toBe(true);

      // Advance timers to trigger interval
      await vi.advanceTimersByTimeAsync(300);

      expect(invoke).toHaveBeenCalledWith('read_oauth_url');
      expect(invoke).toHaveBeenCalledWith('send_pty_input', { input: 'https://localhost/?code=123' });
      expect(store.waitingForOauthResult).toBe(false);
      expect(logStore.log).toContain('send oauth code to freerdp process');
    });
  });

  describe('stopWaitingForOauthResult', () => {
    it('stops waiting for OAuth result', async () => {
      const store = useRdpConnectionStore();
      store.waitingForOauthResult = true;
      store.oauthWaiterIntervalId = setInterval(() => {}, 1000) as any;

      await store.stopWaitingForOauthResult();

      expect(store.waitingForOauthResult).toBe(false);
      expect(invoke).toHaveBeenCalledWith('close_oauth_window');
    });
  });

  describe('toggleRdp', () => {
    it('toggles RDP on and off', async () => {
      const store = useRdpConnectionStore();
      const startRdpSpy = vi.spyOn(store, 'startRdp').mockResolvedValue(undefined);
      const stopPtySpy = vi.spyOn(store, 'stopPty').mockResolvedValue(undefined);

      // Toggle ON
      await store.toggleRdp();
      expect(startRdpSpy).toHaveBeenCalled();

      // Toggle OFF
      store.processIsRunning = true;
      await store.toggleRdp();
      expect(stopPtySpy).toHaveBeenCalled();
    });
  });

  describe('focusRdp', () => {
    it('calls focus_rdp command', async () => {
      const store = useRdpConnectionStore();
      (invoke as any).mockResolvedValue(undefined);

      await store.focusRdp();

      expect(invoke).toHaveBeenCalledWith('focus_rdp');
    });

    it('logs error when focus_rdp fails', async () => {
      const store = useRdpConnectionStore();
      const logStore = useLogStore();
      const errorMessage = 'xdotool not found';
      (invoke as any).mockRejectedValue(errorMessage);

      await store.focusRdp();

      expect(invoke).toHaveBeenCalledWith('focus_rdp');
      expect(logStore.log).toContain(errorMessage);
    });
  });
});
