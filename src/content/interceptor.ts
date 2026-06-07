import { showWarningModal } from "./ui";
import { SafeHitConfig } from "../utils/storage";

// Initialize empty config, to be populated by bridge.ts
let activeConfig: SafeHitConfig = { blockedUrls: [], mockRules: [] };

// Listen for messages from the ISOLATED world
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
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const isProductionUrl = activeConfig.blockedUrls.some((u) => url.includes(u));

  if (isMutation && isProductionUrl) {
    const isConfirmed = await showWarningModal(method, url);
    if (!isConfirmed) return Promise.reject(new Error("Aborted by SafeHit"));
  }

  return originalFetch.apply(this, args);
};
