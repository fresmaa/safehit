import { showWarningModal } from "./ui";
import { SafeHitConfig } from "../utils/storage";

// Initialize empty config, to be populated by bridge.ts
let activeConfig: SafeHitConfig = { blockedUrls: [], mockRules: [] };

// Listen for messages from the ISOLATED world (Bridge)
window.addEventListener("message", (event) => {
  if (event.data && event.data.source === "SAFEHIT_BRIDGE") {
    activeConfig = event.data.payload;
    console.log("[SafeHit] Configuration synchronized:", activeConfig);
  }
});

// Override the original fetch function
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const [resource, configObj] = args;
  const url =
    typeof resource === "string"
      ? resource
      : resource instanceof Request
        ? resource.url
        : "";
  const method = (configObj?.method || "GET").toUpperCase();

  if (activeConfig.mockRules && activeConfig.mockRules.length > 0) {
    const matchedRule = activeConfig.mockRules.find(
      (rule) => rule.method === method && url.includes(rule.url),
    );

    if (matchedRule) {
      console.log(`[SafeHit] 🎭 MOCKING INTERCEPTED: ${method} ${url}`);

      return new Response(matchedRule.responseBody, {
        status: matchedRule.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }

  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isProductionUrl = activeConfig.blockedUrls.some(
    (rule) => rule.active && url.includes(rule.url)
  );

  if (isMutation && isProductionUrl) {
    console.log(`[SafeHit] 🛡️ SAFEGUARD BLOCKED: ${method} ${url}`);
    const isConfirmed = await showWarningModal(method, url);
    if (!isConfirmed) return Promise.reject(new Error("Aborted by SafeHit"));
  }

  // Jika tidak di-mock dan tidak diblokir, lanjutkan request aslinya
  return originalFetch.apply(this, args);
};
