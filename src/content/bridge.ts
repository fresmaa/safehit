import { StorageHelper } from "../utils/storage";
import { Language } from "../utils/i18n";
import { logger } from "../utils/logger";

const getLanguage = (): Promise<Language> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get("safeHitLanguage", (data) => {
      resolve((data.safeHitLanguage as Language) || "en");
    });
  });
};

const syncConfigToMainWorld = async () => {
  const config = await StorageHelper.getConfig();
  const language = await getLanguage();
  window.postMessage(
    {
      source: "SAFEHIT_BRIDGE",
      payload: config,
      language,
    },
    "*",
  );
};

syncConfigToMainWorld();

chrome.storage.onChanged.addListener((changes: any, namespace: string) => {
  if (namespace === "sync") {
    if (changes.safeHitConfig) {
      window.postMessage(
        {
          source: "SAFEHIT_BRIDGE",
          payload: changes.safeHitConfig.newValue,
        },
        "*",
      );
    }
    if (changes.safeHitLanguage) {
      window.postMessage(
        {
          source: "SAFEHIT_BRIDGE",
          payload: null,
          language: changes.safeHitLanguage.newValue,
        },
        "*",
      );
    }
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    if (message.action === "SAFEHIT_EXECUTE_CLIENT_REQUEST") {
      const { method, url, body, headers: customHeaders } = message.payload;

      logger.log(`Bridge executing request: ${method} ${url}`);

      const TOKEN_KEYS = [
        "token",
        "accessToken",
        "access_token",
        "authToken",
        "auth_token",
        "jwt",
        "id_token",
        "idToken",
        "apiKey",
        "api_key",
      ];

      let token = "";
      for (const key of TOKEN_KEYS) {
        token =
          localStorage.getItem(key) || sessionStorage.getItem(key) || "";
        if (token) break;
      }

      const finalHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(customHeaders || {}),
      };

      if (token) {
        token = token.replace(/^["']|["']$/g, "");
        if (!finalHeaders["Authorization"]) {
          finalHeaders["Authorization"] = token
            .toLowerCase()
            .startsWith("bearer")
            ? token
            : `Bearer ${token}`;
        }
      }

      fetch(url, {
        method: method,
        headers: finalHeaders,
        body: method !== "GET" ? body : undefined,
        credentials: "include",
      })
        .then(async (res) => {
          const status = res.status;

          const responseHeaders: Record<string, string> = {};
          res.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          const textData = await res.text();
          let jsonData = textData;

          try {
            jsonData = JSON.parse(textData);
          } catch (e) {
            logger.log("Response is not valid JSON, returning as text");
          }

          sendResponse({
            success: true,
            status,
            data: jsonData,
            headers: responseHeaders,
          });
        })
        .catch((err) => {
          logger.error("Request failed:", err.message);
          sendResponse({ success: false, status: 500, data: err.message });
        });

      return true;
    }
  },
);
