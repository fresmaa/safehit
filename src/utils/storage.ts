// Interface untuk struktur data kita
export interface SafeHitConfig {
  blockedUrls: string[];
  mockRules: {
    url: string;
    method: string;
    responseBody: string; // JSON string
  }[];
}

const DEFAULT_CONFIG: SafeHitConfig = {
  blockedUrls: [],
  mockRules: []
};

export const StorageHelper = {
  // Mengambil konfigurasi dari Chrome Storage
  getConfig: async (): Promise<SafeHitConfig> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['safeHitConfig'], (result: any) => {
        // Kita gunakan 'as SafeHitConfig' agar TypeScript yakin
        const config = result.safeHitConfig as SafeHitConfig;
        resolve(config || DEFAULT_CONFIG);
      });
    });
  },

  // Menyimpan konfigurasi baru ke Chrome Storage
  saveConfig: async (newConfig: SafeHitConfig): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ safeHitConfig: newConfig }, () => {
        resolve();
      });
    });
  }
};