import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { showToast } from "../utils/toast";

export const initApiClient = () => {
  const refreshTabsBtn = document.getElementById("refresh-tabs-btn") as HTMLButtonElement;
  const clientUrlInput = document.getElementById("client-url") as HTMLInputElement;
  const clientSendBtn = document.getElementById("client-send-btn") as HTMLButtonElement;
  const clientStatusSpan = document.getElementById("client-response-status") as HTMLSpanElement;
  const clientMethodInput = document.getElementById("client-method") as HTMLInputElement;

  const clientTabInput = document.getElementById("client-tab-input") as HTMLInputElement;
  const clientTabTrigger = document.getElementById("client-tab-trigger") as HTMLButtonElement;
  const clientTabText = document.getElementById("client-tab-text") as HTMLSpanElement;
  const clientTabDropdown = document.getElementById("client-tab-dropdown") as HTMLDivElement;
  const clientTabArrow = document.getElementById("client-tab-arrow") as HTMLElement;

  const tabBodyBtn = document.getElementById("tab-body-btn") as HTMLButtonElement;
  const tabHeadersBtn = document.getElementById("tab-headers-btn") as HTMLButtonElement;
  const tabParamsBtn = document.getElementById("tab-params-btn") as HTMLButtonElement;
  const clientBodyContainer = document.getElementById("client-body-editor") as HTMLDivElement;
  const clientHeadersContainer = document.getElementById("client-headers-editor") as HTMLDivElement;
  const clientParamsContainer = document.getElementById("client-params-editor") as HTMLDivElement;

  const clientMethodTrigger = document.getElementById("client-method-trigger") as HTMLButtonElement;
  const clientMethodDropdown = document.getElementById("client-method-dropdown") as HTMLDivElement;
  const clientMethodText = document.getElementById("client-method-text") as HTMLSpanElement;
  const clientMethodArrow = document.getElementById("client-method-arrow") as HTMLElement;

  const clientBodyEditor = new EditorView({
    doc: "{\n  \n}",
    extensions: [basicSetup, json(), oneDark],
    parent: document.getElementById("client-body-editor") as HTMLDivElement,
  });

  const clientHeadersEditor = new EditorView({
    extensions: [basicSetup, json(), oneDark],
    parent: document.getElementById("client-headers-editor") as HTMLDivElement,
  });

  const clientParamsEditor = new EditorView({
    doc: "{\n  \n}",
    extensions: [basicSetup, json(), oneDark],
    parent: document.getElementById("client-params-editor") as HTMLDivElement,
  });

  const clientResponseEditor = new EditorView({
    doc: "// Response will appear here after execution...",
    extensions: [basicSetup, json(), oneDark, EditorView.editable.of(false), EditorView.lineWrapping],
    parent: document.getElementById("client-response-editor") as HTMLDivElement,
  });

  const clientResponseHeadersEditor = new EditorView({
    doc: "// Response headers will appear here...",
    extensions: [basicSetup, json(), oneDark, EditorView.editable.of(false), EditorView.lineWrapping],
    parent: document.getElementById("client-response-headers-editor") as HTMLDivElement,
  });

  const switchEditorTab = (activeTab: "body" | "headers" | "params") => {
    const activeStyle = "px-3 py-1 text-[10px] font-bold text-zinc-300 bg-white/10 rounded-md transition-colors";
    const inactiveStyle = "px-3 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors";

    tabBodyBtn.className = activeTab === "body" ? activeStyle : inactiveStyle;
    tabHeadersBtn.className = activeTab === "headers" ? activeStyle : inactiveStyle;
    tabParamsBtn.className = activeTab === "params" ? activeStyle : inactiveStyle;

    clientBodyContainer.style.display = activeTab === "body" ? "block" : "none";
    clientHeadersContainer.style.display = activeTab === "headers" ? "block" : "none";
    clientParamsContainer.style.display = activeTab === "params" ? "block" : "none";
  };

  tabBodyBtn.addEventListener("click", () => switchEditorTab("body"));
  tabHeadersBtn.addEventListener("click", () => switchEditorTab("headers"));
  tabParamsBtn.addEventListener("click", () => switchEditorTab("params"));

  const resTabPayloadBtn = document.getElementById("res-tab-payload-btn") as HTMLButtonElement;
  const resTabHeadersBtn = document.getElementById("res-tab-headers-btn") as HTMLButtonElement;
  const resPayloadContainer = document.getElementById("client-response-editor") as HTMLDivElement;
  const resHeadersContainer = document.getElementById("client-response-headers-editor") as HTMLDivElement;

  const switchResTab = (tab: "payload" | "headers") => {
    const activeClass = "text-xs font-bold text-blue-400 border-b-2 border-blue-400 pb-1 transition-all";
    const inactiveClass = "text-xs font-bold text-zinc-600 hover:text-zinc-400 pb-1 transition-all border-b-2 border-transparent";

    resTabPayloadBtn.className = tab === "payload" ? activeClass : inactiveClass;
    resTabHeadersBtn.className = tab === "headers" ? activeClass : inactiveClass;

    resPayloadContainer.style.display = tab === "payload" ? "block" : "none";
    resHeadersContainer.style.display = tab === "headers" ? "block" : "none";
  };

  resTabPayloadBtn.addEventListener("click", () => switchResTab("payload"));
  resTabHeadersBtn.addEventListener("click", () => switchResTab("headers"));

  clientMethodTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    clientMethodDropdown.classList.toggle("hidden");
    clientMethodArrow.classList.toggle("rotate-180");
  });

  document.querySelectorAll(".client-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = (opt as HTMLElement).dataset.value as string;
      clientMethodText.textContent = val;
      clientMethodInput.value = val;
      clientMethodDropdown.classList.add("hidden");
      clientMethodArrow.classList.remove("rotate-180");

      clientMethodTrigger.className = clientMethodTrigger.className.replace(
        /text-(blue|green|yellow|orange|red)-400/,
        "",
      );
      if (val === "GET") clientMethodTrigger.classList.add("text-blue-400");
      if (val === "POST") clientMethodTrigger.classList.add("text-green-400");
      if (val === "PUT") clientMethodTrigger.classList.add("text-yellow-400");
      if (val === "PATCH") clientMethodTrigger.classList.add("text-orange-400");
      if (val === "DELETE") clientMethodTrigger.classList.add("text-red-400");
    });
  });

  clientTabTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    clientTabDropdown.classList.toggle("hidden");
    clientTabArrow.classList.toggle("rotate-180");
  });

  const refreshTabsList = async () => {
    const allTabs = await chrome.tabs.query({});
    const validTabs = allTabs.filter(
      (tab) => tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://")),
    );

    clientTabDropdown.innerHTML = "";

    if (validTabs.length === 0) {
      clientTabText.textContent = "No valid web tabs found";
      clientTabInput.value = "";
      clientTabDropdown.innerHTML =
        '<div class="px-3 py-2 text-xs text-zinc-500 text-center">No valid web tabs found</div>';
      return;
    }

    validTabs.forEach((tab, index) => {
      let domain = "Unknown";
      try { domain = new URL(tab.url!).hostname; } catch (e) {}

      const optionText = `[${domain}] - ${tab.title}`;

      if (index === 0) {
        clientTabText.textContent = optionText;
        clientTabInput.value = tab.id!.toString();
      }

      const optionDiv = document.createElement("div");
      optionDiv.className =
        "px-3 py-2.5 text-xs text-zinc-300 hover:bg-blue-500/20 hover:text-blue-300 cursor-pointer transition-colors truncate border-b border-white/5 last:border-0";
      optionDiv.textContent = optionText;

      optionDiv.addEventListener("click", () => {
        clientTabText.textContent = optionText;
        clientTabInput.value = tab.id!.toString();
        clientTabDropdown.classList.add("hidden");
        clientTabArrow.classList.remove("rotate-180");
      });

      clientTabDropdown.appendChild(optionDiv);
    });
  };

  if (refreshTabsBtn) {
    refreshTabsBtn.addEventListener("click", refreshTabsList);
  }

  const updateResponseEditor = (text: string, status: number, headersObj?: any) => {
    clientResponseEditor.dispatch({
      changes: { from: 0, to: clientResponseEditor.state.doc.length, insert: text },
    });

    const headersText = headersObj ? JSON.stringify(headersObj, null, 2) : "// No headers received";
    clientResponseHeadersEditor.dispatch({
      changes: { from: 0, to: clientResponseHeadersEditor.state.doc.length, insert: headersText },
    });

    clientStatusSpan.textContent = `STATUS: ${status || "ERROR"}`;
    if (status >= 200 && status < 300) {
      clientStatusSpan.className =
        "font-mono text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/10 shadow-sm";
    } else {
      clientStatusSpan.className =
        "font-mono text-[10px] px-2 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/10 shadow-sm";
    }
  };

  clientSendBtn.addEventListener("click", async () => {
    let targetUrl = clientUrlInput.value.trim();
    const method = clientMethodInput.value;
    const bodyText = clientBodyEditor.state.doc.toString().trim();

    const headersText = clientHeadersEditor.state.doc.toString().trim();
    let customHeadersObj = {};
    if (headersText && headersText !== "{\n  \n}" && headersText !== "{}") {
      try { customHeadersObj = JSON.parse(headersText); } catch (e) {
        showToast("Invalid JSON format in Headers tab!", "error");
        return;
      }
    }

    const paramsText = clientParamsEditor.state.doc.toString().trim();
    let customParamsObj: Record<string, string> = {};
    if (paramsText && paramsText !== "{\n  \n}" && paramsText !== "{}") {
      try { customParamsObj = JSON.parse(paramsText); } catch (e) {
        showToast("Invalid JSON format in Params tab!", "error");
        return;
      }
    }

    if (!targetUrl) {
      showToast("Please enter a valid Target URL!", "warning");
      return;
    }

    if (Object.keys(customParamsObj).length > 0) {
      try {
        const urlObj = new URL(targetUrl);
        Object.entries(customParamsObj).forEach(([key, value]) => {
          urlObj.searchParams.append(key, String(value));
        });
        targetUrl = urlObj.toString();
      } catch (e) {
        showToast(
          "Invalid Target URL format! Please ensure it starts with http:// or https://",
          "error",
        );
        return;
      }
    }

    clientSendBtn.disabled = true;
    clientSendBtn.textContent = "Executing via Tab...";
    clientStatusSpan.textContent = "STATUS: LOADING";
    clientStatusSpan.className =
      "font-mono text-[10px] px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/10 shadow-sm";

    try {
      const selectedTabId = parseInt(clientTabInput.value);
      if (!selectedTabId || isNaN(selectedTabId))
        throw new Error("Please select a valid Execution Context.");

      chrome.tabs.sendMessage(
        selectedTabId,
        {
          action: "SAFEHIT_EXECUTE_CLIENT_REQUEST",
          payload: { method, url: targetUrl, body: bodyText, headers: customHeadersObj },
        },
        (response) => {
          clientSendBtn.disabled = false;
          clientSendBtn.innerHTML = `Send Request <svg class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>`;

          if (chrome.runtime.lastError || !response) {
            const errMsg =
              chrome.runtime.lastError?.message ||
              "Failed to communicate with tab. Make sure the page is fully loaded.";
            updateResponseEditor(`// Error: ${errMsg}`, 500);
            return;
          }

          if (response.success) {
            const stringifiedResult =
              typeof response.data === "object" ? JSON.stringify(response.data, null, 2) : response.data;
            updateResponseEditor(stringifiedResult, response.status, response.headers);
          } else {
            updateResponseEditor(
              `// Request Failed\n${JSON.stringify(response.data, null, 2)}`,
              response.status,
              response.headers,
            );
          }
        },
      );
    } catch (error: any) {
      clientSendBtn.disabled = false;
      clientSendBtn.innerHTML = `Send Request <svg class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>`;
      updateResponseEditor(`// Error:\n${error.message}`, 0);
    }
  });

  return { refreshTabsList, clientTabTrigger, clientTabDropdown, clientTabArrow };
};
