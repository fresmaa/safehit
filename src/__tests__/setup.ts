import { vi } from "vitest";

const storage: Record<string, any> = {};

const chromeStub = {
  storage: {
    sync: {
      get: vi.fn((key: string, cb: (data: any) => void) => {
        cb({ [key]: storage[key] });
      }),
      set: vi.fn((items: Record<string, any>, cb?: () => void) => {
        Object.assign(storage, items);
        cb?.();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    lastError: null,
    sendMessage: vi.fn(),
    openOptionsPage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn(),
  },
};

Object.assign(globalThis, { chrome: chromeStub });
