import { StorageHelper } from "../utils/storage";

const syncConfigToMainWorld = async () => {
  const config = await StorageHelper.getConfig();
  window.postMessage(
    {
      source: "SAFEHIT_BRIDGE",
      payload: config,
    },
    "*",
  );
};

syncConfigToMainWorld();

chrome.storage.onChanged.addListener((changes: any, namespace: string) => {
  if (namespace === "sync" && changes.safeHitConfig) {
    window.postMessage(
      {
        source: "SAFEHIT_BRIDGE",
        payload: changes.safeHitConfig.newValue,
      },
      "*",
    );
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    if (message.action === "SAFEHIT_EXECUTE_CLIENT_REQUEST") {
      const { method, url, body } = message.payload;

      console.log(`[SafeHit Bridge] Executing request: ${method} ${url}`);

      let token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken") ||
        "";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        token = token.replace(/^["']|["']$/g, "");
        headers["Authorization"] = token.toLowerCase().startsWith("bearer")
          ? token
          : `Bearer ${token}`;
        console.log("[SafeHit Bridge] Auth Token attached automatically!");
      }

      fetch(url, {
        method: method,
        headers: headers,
        body: method !== "GET" ? body : undefined,
        credentials: "include",
      })
        .then(async (res) => {
          const status = res.status;
          const textData = await res.text();
          let jsonData = textData;

          try {
            jsonData = JSON.parse(textData);
          } catch (e) {
          }

          sendResponse({ success: true, status, data: jsonData });
        })
        .catch((err) => {
          sendResponse({ success: false, status: 500, data: err.message });
        });

      return true;
    }
  },
);
