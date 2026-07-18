import { showWarningModal } from "./ui";
import { SafeHitConfig, MockRule, SafeguardRule, matchUrl } from "../utils/storage";
import { logger } from "../utils/logger";

let activeConfig: SafeHitConfig = { blockedUrls: [], mockRules: [] };
let configReady = false;
let configReadyResolve: (() => void) | null = null;
const configReadyPromise = new Promise<void>((resolve) => {
  configReadyResolve = resolve;
});

const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

window.addEventListener("message", (event) => {
  if (
    event.data &&
    event.data.source === "SAFEHIT_BRIDGE"
  ) {
    if (event.data.payload) {
      activeConfig = event.data.payload;
    }
    if (!configReady) {
      configReady = true;
      configReadyResolve?.();
    }
    logger.log("Configuration synchronized");
  }
});

const waitForConfig = async (): Promise<void> => {
  if (configReady) return;
  await configReadyPromise;
};

const findMatchingMockRule = (
  method: string,
  url: string,
): MockRule | undefined => {
  return activeConfig.mockRules?.find(
    (rule) => rule.active && rule.method === method && matchUrl(url, rule.url, rule.matchType),
  );
};

const isProtectedUrl = (url: string): SafeguardRule | undefined => {
  return activeConfig.blockedUrls?.find(
    (rule) => rule.active && url.includes(rule.url),
  );
};

const originalFetch = window.fetch;

window.fetch = async function (...args): Promise<Response> {
  await waitForConfig();

  const [resource, configObj] = args;
  const url =
    typeof resource === "string"
      ? resource
      : resource instanceof Request
        ? resource.url
        : "";
  const method = (configObj?.method || "GET").toUpperCase();

  const matchedRule = findMatchingMockRule(method, url);
  if (matchedRule) {
    logger.log(`MOCKING INTERCEPTED: ${method} ${url}`);
    return new Response(matchedRule.responseBody, {
      status: matchedRule.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (MUTATION_METHODS.includes(method) && isProtectedUrl(url)) {
    logger.log(`SAFEGUARD BLOCKED: ${method} ${url}`);
    const isConfirmed = await showWarningModal(method, url);
    if (!isConfirmed) return Promise.reject(new Error("Aborted by SafeHit"));
  }

  return originalFetch.apply(this, args);
};

const OriginalXHR = window.XMLHttpRequest;
const originalXhrOpen = OriginalXHR.prototype.open;
const originalXhrSend = OriginalXHR.prototype.send;

OriginalXHR.prototype.open = function (
  this: XMLHttpRequest & { _shMethod?: string; _shUrl?: string; _shAsync?: boolean },
  method: string,
  url: string | URL,
  async: boolean = true,
  ...rest: any[]
) {
  this._shMethod = method.toUpperCase();
  this._shUrl = typeof url === "string" ? url : url.toString();
  this._shAsync = async;
  return originalXhrOpen.apply(this, [method, url, async, ...rest] as any);
};

OriginalXHR.prototype.send = function (
  this: XMLHttpRequest & { _shMethod?: string; _shUrl?: string; _shAsync?: boolean },
  body?: any,
) {
  const method = this._shMethod || "GET";
  const url = this._shUrl || "";
  const isAsync = this._shAsync !== false;

  const handleMockResponse = (rule: MockRule) => {
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(rule.responseBody);
    } catch {
      parsedResponse = rule.responseBody;
    }

    const mockHeaders: Record<string, string> = {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    };

    Object.defineProperty(this, "status", { value: rule.status, writable: true });
    Object.defineProperty(this, "statusText", { value: "OK", writable: true });
    Object.defineProperty(this, "responseText", { value: rule.responseBody, writable: true });
    Object.defineProperty(this, "responseURL", { value: url, writable: true });
    Object.defineProperty(this, "readyState", { value: XMLHttpRequest.LOADING, writable: true });

    if (this.responseType === "" || this.responseType === "text" || this.responseType === "json") {
      Object.defineProperty(this, "response", { value: parsedResponse, writable: true });
    }

    const headerStr = Object.entries(mockHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\r\n");
    this.getAllResponseHeaders = () => headerStr + "\r\n";
    this.getResponseHeader = (name: string) =>
      mockHeaders[name.toLowerCase()] ?? null;

    this.dispatchEvent(new Event("readystatechange"));

    queueMicrotask(() => {
      Object.defineProperty(this, "readyState", {
        value: XMLHttpRequest.DONE,
        writable: true,
      });
      this.dispatchEvent(new Event("readystatechange"));
      this.dispatchEvent(new Event("load"));
      this.dispatchEvent(new Event("loadend"));
    });
  };

  const handleXHRError = (message: string) => {
    Object.defineProperty(this, "readyState", { value: XMLHttpRequest.DONE, writable: true });
    Object.defineProperty(this, "status", { value: 0, writable: true });
    Object.defineProperty(this, "statusText", { value: message, writable: true });
    this.dispatchEvent(new Event("readystatechange"));
    this.dispatchEvent(new Event("error"));
    this.dispatchEvent(new Event("loadend"));
  };

  const proceedWithRequest = () => {
    const headers: Record<string, string> = {};
    try {
      const raw = (this as any)._headerMap || {};
      for (const [key, value] of Object.entries(raw)) {
        headers[key] = value as string;
      }
    } catch {}

    originalFetch(url, {
      method,
      headers,
      body: method !== "GET" && method !== "HEAD" ? body : null,
      credentials: "include",
    })
      .then(async (res) => {
        const responseHeaders: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseBody: any;
        const contentType = res.headers.get("content-type") || "";
        if (this.responseType === "arraybuffer") {
          responseBody = await res.arrayBuffer();
        } else {
          responseBody = await res.text();
          if (contentType.includes("application/json")) {
            try {
              responseBody = JSON.parse(responseBody);
            } catch {}
          }
        }

        Object.defineProperty(this, "status", { value: res.status, writable: true });
        Object.defineProperty(this, "statusText", {
          value: res.statusText,
          writable: true,
        });
        Object.defineProperty(this, "responseURL", { value: url, writable: true });
        Object.defineProperty(this, "response", { value: responseBody, writable: true });

        if (this.responseType === "" || this.responseType === "text") {
          Object.defineProperty(this, "responseText", {
            value: typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody),
            writable: true,
          });
        }

        const headerStr = Object.entries(responseHeaders)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n");
        this.getAllResponseHeaders = () => headerStr + "\r\n";
        this.getResponseHeader = (name: string) =>
          responseHeaders[name.toLowerCase()] ?? null;

        Object.defineProperty(this, "readyState", {
          value: XMLHttpRequest.DONE,
          writable: true,
        });
        this.dispatchEvent(new Event("readystatechange"));
        this.dispatchEvent(new Event("load"));
        this.dispatchEvent(new Event("loadend"));
      })
      .catch((err) => {
        handleXHRError(err.message || "Network error");
      });
  };

  if (!isAsync) {
    return originalXhrSend.call(this, body);
  }

  (async () => {
    try {
      await waitForConfig();

      const matchedRule = findMatchingMockRule(method, url);
      if (matchedRule) {
        logger.log(`XHR MOCKING INTERCEPTED: ${method} ${url}`);
        handleMockResponse(matchedRule);
        return;
      }

      if (MUTATION_METHODS.includes(method) && isProtectedUrl(url)) {
        logger.log(`XHR SAFEGUARD BLOCKED: ${method} ${url}`);
        const isConfirmed = await showWarningModal(method, url);
        if (!isConfirmed) {
          handleXHRError("Aborted by SafeHit");
          return;
        }
      }

      proceedWithRequest();
    } catch (err: any) {
      handleXHRError(err.message || "SafeHit XHR error");
    }
  })();
};
