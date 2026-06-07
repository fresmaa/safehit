export interface SafeHitConfig {
  blockedUrls: string[];
  mockRules: {
    url: string;
    method: string;
    responseBody: string;
  }[];
}

const DEFAULT_CONFIG: SafeHitConfig = {
  blockedUrls: [],
  mockRules: [],
};

export const StorageHelper = {
  // Retrieves configuration from Chrome Storage
  getConfig: async (): Promise<SafeHitConfig> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["safeHitConfig"], (result: any) => {
        // Assert as SafeHitConfig for TypeScript type safety
        const config = result.safeHitConfig as SafeHitConfig;
        resolve(config || DEFAULT_CONFIG);
      });
    });
  },

  // Saves configuration to Chrome Storage
  saveConfig: async (newConfig: SafeHitConfig): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ safeHitConfig: newConfig }, () => {
        resolve();
      });
    });
  },
};
