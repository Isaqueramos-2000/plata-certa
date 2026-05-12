import { vi } from 'vitest';

/**
 * Stubs de módulos nativos que os arquivos de produção importam.
 * Os testes só exercitam lógica pura — não precisamos de implementações
 * reais. Cada mock faz o mínimo necessário pra os imports não quebrarem.
 */

vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (m: { web?: unknown; default?: unknown }) => m.web ?? m.default },
}));

vi.mock('@react-native-async-storage/async-storage', () => {
  // Backing store em memória — útil pra testes que escrevem/lêem cache.
  const store = new Map<string, string>();
  return {
    default: {
      getItem: async (k: string) => store.get(k) ?? null,
      setItem: async (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: async (k: string) => {
        store.delete(k);
      },
      multiRemove: async (keys: string[]) => {
        keys.forEach((k) => store.delete(k));
      },
      getAllKeys: async () => Array.from(store.keys()),
      clear: async () => {
        store.clear();
      },
    },
  };
});

// expo-file-system/legacy: no-op — testes não exercitam I/O de arquivo.
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  makeDirectoryAsync: async () => {},
  writeAsStringAsync: async () => {},
  readAsStringAsync: async () => '',
  copyAsync: async () => {},
  deleteAsync: async () => {},
  getInfoAsync: async () => ({ exists: false, isDirectory: false, uri: '', size: 0 }),
}));

// expo-notifications: no-op em todos os testes.
vi.mock('expo-notifications', () => ({
  setNotificationHandler: () => {},
  setNotificationChannelAsync: async () => {},
  getPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
  requestPermissionsAsync: async () => ({ granted: false }),
  scheduleNotificationAsync: async () => 'fake-notification-id',
  cancelScheduledNotificationAsync: async () => {},
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));
