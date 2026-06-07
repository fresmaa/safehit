export interface SafeHitConfig {
  blockedUrls: string[];
  mockRules: MockRule[];
}

const DEFAULT_CONFIG: SafeHitConfig = {
  blockedUrls: [],
  mockRules: [],
};

export interface MockRule {
  id: string;
  url: string;
  method: string;
  status: number;
  responseBody: string;
}

export interface SafeHitConfig {
  blockedUrls: string[];
  mockRules: MockRule[];
}

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
