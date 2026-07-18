export type MatchType = "contains" | "exact" | "regex";

export interface MockRule {
  id: string;
  url: string;
  method: string;
  status: number;
  responseBody: string;
  active: boolean;
  matchType: MatchType;
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

        config.mockRules = (config.mockRules || []).map((item: any) => {
          return {
            ...item,
            active: item.active === undefined ? true : item.active,
            matchType: item.matchType || "contains",
          };
        });

        resolve(config);
      });
    });
  },

  saveConfig: async (newConfig: SafeHitConfig): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ safeHitConfig: newConfig }, () => {
        resolve();
      });
    });
  },
};

export const matchUrl = (
  requestUrl: string,
  ruleUrl: string,
  matchType: MatchType,
): boolean => {
  switch (matchType) {
    case "exact":
      return requestUrl === ruleUrl;
    case "regex":
      try {
        return new RegExp(ruleUrl).test(requestUrl);
      } catch {
        return false;
      }
    case "contains":
    default:
      return requestUrl.includes(ruleUrl);
  }
};
