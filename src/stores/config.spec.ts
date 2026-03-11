import type { Store } from '@tauri-apps/plugin-store';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfigStore } from './config';

describe('Config Store', () => {
  let mockStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      save: vi.fn(),
    };
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const store = useConfigStore();
      expect(store.configs).toEqual([]);
      expect(store.selectedIndex).toBe(0);
    });
  });

  describe('initConfig', () => {
    it('initializes with default config if store is empty', async () => {
      const store = useConfigStore();
      mockStore.get.mockResolvedValue(null);

      await store.initConfig(mockStore as unknown as Store);

      expect(store.configs).toHaveLength(1);
      expect(store.configs[0]!.title).toBe('Default Config');
      expect(store.selectedIndex).toBe(0);
    });

    it('initializes from store values', async () => {
      const store = useConfigStore();
      const mockConfigs = [{ title: 'Saved Config', config: { rdpFile: 'test.rdp', freerdpPath: 'freerdp', username: '', connectionParams: [] } }];

      mockStore.get.mockImplementation((key: string) => {
        if (key === 'configs') {
          return Promise.resolve(mockConfigs);
        }
        if (key === 'selectedIndex') {
          return Promise.resolve(0);
        }
        return Promise.resolve(null);
      });

      await store.initConfig(mockStore as unknown as Store);

      expect(store.configs).toEqual(mockConfigs);
      expect(store.selectedIndex).toBe(0);
    });
  });

  describe('addConfig', () => {
    it('adds a new config', async () => {
      const store = useConfigStore();
      await store.addConfig();
      expect(store.configs).toHaveLength(1);
      expect(store.configs[0]!.title).toBe('New Config');

      await store.addConfig();
      expect(store.configs).toHaveLength(2);
      expect(store.configs[1]!.title).toBe('New Config (1)');
      expect(store.selectedIndex).toBe(1);
    });
  });

  describe('cloneConfig', () => {
    it('clones a config', async () => {
      const store = useConfigStore();
      store.configs = [{ title: 'Original', config: { rdpFile: 'o.rdp', freerdpPath: 'p', username: 'u', connectionParams: ['a'] } }];

      await store.cloneConfig(0);

      expect(store.configs).toHaveLength(2);
      expect(store.configs[1]!.title).toBe('Original (Copy)');
      expect(store.configs[1]!.config.username).toBe('u');
      expect(store.configs[1]!.config.connectionParams).toEqual(['a']);
      expect(store.selectedIndex).toBe(1);
    });
  });

  describe('deleteConfig', () => {
    it('deletes a config', async () => {
      const store = useConfigStore();
      store.configs = [
        { title: 'C1', config: {} as any },
        { title: 'C2', config: {} as any },
      ];
      store.selectedIndex = 1;

      await store.deleteConfig(1);
      expect(store.configs).toHaveLength(1);
      expect(store.configs[0]!.title).toBe('C1');
      expect(store.selectedIndex).toBe(0);
    });

    it('does not delete the last config', async () => {
      const store = useConfigStore();
      store.configs = [{ title: 'C1', config: {} as any }];

      await store.deleteConfig(0);
      expect(store.configs).toHaveLength(1);
    });
  });

  describe('saveConfig', () => {
    it('saves config to store', async () => {
      const store = useConfigStore();
      store.configs = [{ title: 'C1', config: {} as any }];
      store.selectedIndex = 0;

      await store.saveConfig(mockStore as unknown as Store);

      expect(mockStore.set).toHaveBeenCalledWith('configs', store.configs);
      expect(mockStore.set).toHaveBeenCalledWith('selectedIndex', 0);
      expect(mockStore.save).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    describe('configIsValid', () => {
      it('correctly reports config validity', () => {
        const store = useConfigStore();
        store.configs = [{ title: 'C1', config: { rdpFile: '', freerdpPath: '', username: '', connectionParams: [] } }];

        expect(store.configIsValid).toBe(false);

        store.configs[0]!.config.rdpFile = 'file.rdp';
        store.configs[0]!.config.freerdpPath = 'path';
        expect(store.configIsValid).toBe(true);
      });
    });
  });
});
