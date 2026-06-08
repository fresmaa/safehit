export interface MockRule {
  id: string;
  url: string;
  method: string;
  status: number;
  responseBody: string;
}

export interface SafeguardRule {
  url: string;
  active: boolean;
}

export interface SafeHitConfig {
  blockedUrls: SafeguardRule[];
  mockRules: MockRule[];
}

export const StorageHelper = {
  // Retrieves configuration from Chrome Storage
  getConfig: async (): Promise<SafeHitConfig> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get("safeHitConfig", (data) => {
        let config = (data.safeHitConfig as SafeHitConfig) || {
          blockedUrls: [],
          mockRules: [],
        };

        config.blockedUrls = (config.blockedUrls || []).map((item: any) => {
          return typeof item === "string" ? { url: item, active: true } : item;
        });

        resolve(config);
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
