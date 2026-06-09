import "../styles/tailwind.css";
import { StorageHelper, SafeHitConfig } from "../utils/storage";
import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";

document.addEventListener("DOMContentLoaded", () => {
  const navMocking = document.getElementById(
    "nav-mocking",
  ) as HTMLButtonElement;
  const navClient = document.getElementById("nav-client") as HTMLButtonElement;
  const viewMocking = document.getElementById("view-mocking") as HTMLDivElement;
  const viewClient = document.getElementById("view-client") as HTMLDivElement;

  const switchView = (view: "mocking" | "client") => {
    if (view === "mocking") {
      navMocking.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-white transition-all";
      navClient.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-all";
      viewMocking.classList.remove("hidden");
      viewClient.classList.add("hidden");
    } else {
      navClient.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-white transition-all";
      navMocking.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-all";
      viewClient.classList.remove("hidden");
      viewClient.classList.add("flex");
      viewMocking.classList.add("hidden");
    }
  };

  navMocking.addEventListener("click", () => switchView("mocking"));

  navClient.addEventListener("click", () => {
    switchView("client");
    refreshTabsList();
  });

  const methodInput = document.getElementById(
    "mock-method",
  ) as HTMLInputElement;
  const urlInput = document.getElementById("mock-url") as HTMLInputElement;
  const statusInput = document.getElementById(
    "mock-status",
  ) as HTMLInputElement;
  const addBtn = document.getElementById("add-mock-btn") as HTMLButtonElement;
  const mockList = document.getElementById("mock-list") as HTMLDivElement;
  const editorContainer = document.getElementById(
    "mock-body-editor",
  ) as HTMLDivElement;

  const methodTrigger = document.getElementById(
    "method-trigger",
  ) as HTMLButtonElement;
  const methodDropdown = document.getElementById(
    "method-dropdown",
  ) as HTMLDivElement;
  const methodSelectedText = document.getElementById(
    "method-selected-text",
  ) as HTMLSpanElement;
  const methodArrow = document.getElementById("method-arrow") as HTMLElement;
  const methodOptions = document.querySelectorAll(".method-option");

  let editingRuleId: string | null = null;
  const defaultJson = '{\n  "success": true,\n  "data": []\n}';

  const bodyEditor = new EditorView({
    doc: defaultJson,
    extensions: [basicSetup, json(), oneDark],
    parent: editorContainer,
  });

  const updateMethodColor = (method: string) => {
    methodTrigger.className = methodTrigger.className.replace(
      /text-(blue|green|yellow|orange|red)-400/,
      "",
    );
    if (method === "GET") methodTrigger.classList.add("text-blue-400");
    if (method === "POST") methodTrigger.classList.add("text-green-400");
    if (method === "PUT") methodTrigger.classList.add("text-yellow-400");
    if (method === "PATCH") methodTrigger.classList.add("text-orange-400");
    if (method === "DELETE") methodTrigger.classList.add("text-red-400");
  };

  methodTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    methodDropdown.classList.toggle("hidden");
    methodArrow.classList.toggle("rotate-180");
  });

  methodOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const value = (option as HTMLElement).dataset.value as string;
      methodSelectedText.textContent = value;
      methodInput.value = value;
      updateMethodColor(value);
      methodDropdown.classList.add("hidden");
      methodArrow.classList.remove("rotate-180");
    });
  });

  const resetForm = () => {
    urlInput.value = "";
    statusInput.value = "200";
    methodInput.value = "GET";
    methodSelectedText.textContent = "GET";
    updateMethodColor("GET");
    editingRuleId = null;
    bodyEditor.dispatch({
      changes: {
        from: 0,
        to: bodyEditor.state.doc.length,
        insert: defaultJson,
      },
    });
    addBtn.textContent = "Save Mock Rule";
    addBtn.className =
      "w-full bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-2 shadow-lg shadow-violet-900/20";
  };

  const renderMocks = async () => {
    const config: SafeHitConfig = await StorageHelper.getConfig();
    mockList.innerHTML = "";

    if (!config.mockRules || config.mockRules.length === 0) {
      mockList.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl p-12 text-center mt-2">
          <p class="text-zinc-500 font-medium">No mock rules configured yet.</p>
          <p class="text-xs text-zinc-600 mt-1">Add a new rule from the panel to get started.</p>
        </div>
      `;
      return;
    }

    config.mockRules.forEach((rule) => {
      const card = document.createElement("div");
      const isActiveClass = rule.active
        ? "border-white/10 opacity-100"
        : "border-white/5 opacity-50";
      card.className = `group bg-white/[0.02] border hover:border-white/20 rounded-2xl p-5 transition-all relative overflow-hidden ${isActiveClass}`;
      const methodColor =
        rule.method === "GET"
          ? "text-blue-400"
          : rule.method === "POST"
            ? "text-green-400"
            : rule.method === "DELETE"
              ? "text-red-400"
              : "text-yellow-400";

      card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">
            <span class="font-bold text-[11px] px-2 py-1 bg-black/40 rounded-md ${methodColor}">${rule.method}</span>
            <span class="font-mono text-sm ${rule.active ? "text-zinc-200" : "text-zinc-500 line-through"}">${rule.url}</span>
          </div>
          <div class="flex items-center gap-3">
            <button data-id="${rule.id}" class="toggle-mock-btn relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.active ? "bg-violet-500" : "bg-white/20"}">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.active ? "translate-x-4" : "translate-x-1"}"></span>
            </button>
            <div class="h-4 w-px bg-white/10"></div>
            <button data-id="${rule.id}" class="edit-btn text-zinc-400 hover:text-blue-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button data-id="${rule.id}" class="delete-btn text-zinc-400 hover:text-rose-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
        <div class="rounded-xl overflow-hidden border border-white/5 mt-3 shadow-inner">
          <div class="bg-black/40 px-3 py-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider border-b border-white/5 flex justify-between">
            <span>Status: ${rule.status}</span>
            <span>Response Body</span>
          </div>
          <div class="cm-readonly-container" id="cm-view-${rule.id}"></div>
        </div>
      `;
      mockList.appendChild(card);

      const viewContainer = document.getElementById(
        `cm-view-${rule.id}`,
      ) as HTMLDivElement;
      new EditorView({
        doc: rule.responseBody,
        extensions: [
          basicSetup,
          json(),
          oneDark,
          EditorView.editable.of(false),
          EditorView.lineWrapping,
        ],
        parent: viewContainer,
      });
    });

    document.querySelectorAll(".toggle-mock-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const newRules = config.mockRules.map((r) =>
          r.id === id ? { ...r, active: !r.active } : r,
        );
        await StorageHelper.saveConfig({ ...config, mockRules: newRules });
        renderMocks();
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const newConfig = {
          ...config,
          mockRules: config.mockRules.filter((r) => r.id !== id),
        };
        await StorageHelper.saveConfig(newConfig);
        if (editingRuleId === id) resetForm();
        renderMocks();
      });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const ruleToEdit = config.mockRules.find((r) => r.id === id);
        if (ruleToEdit) {
          methodInput.value = ruleToEdit.method;
          methodSelectedText.textContent = ruleToEdit.method;
          updateMethodColor(ruleToEdit.method);
          urlInput.value = ruleToEdit.url;
          statusInput.value = ruleToEdit.status.toString();
          bodyEditor.dispatch({
            changes: {
              from: 0,
              to: bodyEditor.state.doc.length,
              insert: ruleToEdit.responseBody,
            },
          });
          editingRuleId = ruleToEdit.id;
          addBtn.textContent = "Update Mock Rule";
          addBtn.className =
            "w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-2 shadow-lg shadow-blue-900/20";
          document
            .querySelector("main")
            ?.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  };

  addBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    const body = bodyEditor.state.doc.toString().trim();
    if (!url || !body) {
      alert("URL and Response Body are required!");
      return;
    }
    const config = await StorageHelper.getConfig();
    let mockRules = config.mockRules || [];
    if (editingRuleId) {
      mockRules = mockRules.map((rule) =>
        rule.id === editingRuleId
          ? {
              ...rule,
              method: methodInput.value,
              url: url,
              status: parseInt(statusInput.value) || 200,
              responseBody: body,
            }
          : rule,
      );
    } else {
      mockRules.push({
        id: Date.now().toString(),
        method: methodInput.value,
        url: url,
        status: parseInt(statusInput.value) || 200,
        responseBody: body,
        active: true,
      });
    }
    await StorageHelper.saveConfig({ ...config, mockRules });
    resetForm();
    renderMocks();
  });

  const refreshTabsBtn = document.getElementById(
    "refresh-tabs-btn",
  ) as HTMLButtonElement;
  const clientUrlInput = document.getElementById(
    "client-url",
  ) as HTMLInputElement;
  const clientSendBtn = document.getElementById(
    "client-send-btn",
  ) as HTMLButtonElement;
  const clientStatusSpan = document.getElementById(
    "client-response-status",
  ) as HTMLSpanElement;
  const clientMethodInput = document.getElementById(
    "client-method",
  ) as HTMLInputElement;

  const clientTabInput = document.getElementById(
    "client-tab-input",
  ) as HTMLInputElement;
  const clientTabTrigger = document.getElementById(
    "client-tab-trigger",
  ) as HTMLButtonElement;
  const clientTabText = document.getElementById(
    "client-tab-text",
  ) as HTMLSpanElement;
  const clientTabDropdown = document.getElementById(
    "client-tab-dropdown",
  ) as HTMLDivElement;
  const clientTabArrow = document.getElementById(
    "client-tab-arrow",
  ) as HTMLElement;

  const clientBodyEditor = new EditorView({
    doc: "{\n  \n}",
    extensions: [basicSetup, json(), oneDark],
    parent: document.getElementById("client-body-editor") as HTMLDivElement,
  });

  const clientResponseEditor = new EditorView({
    doc: "// Response will appear here after execution...",
    extensions: [
      basicSetup,
      json(),
      oneDark,
      EditorView.editable.of(false),
      EditorView.lineWrapping,
    ],
    parent: document.getElementById("client-response-editor") as HTMLDivElement,
  });

  const clientMethodTrigger = document.getElementById(
    "client-method-trigger",
  ) as HTMLButtonElement;
  const clientMethodDropdown = document.getElementById(
    "client-method-dropdown",
  ) as HTMLDivElement;
  const clientMethodText = document.getElementById(
    "client-method-text",
  ) as HTMLSpanElement;
  const clientMethodArrow = document.getElementById(
    "client-method-arrow",
  ) as HTMLElement;

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

  document.addEventListener("click", (e) => {
    if (
      !methodTrigger.contains(e.target as Node) &&
      !methodDropdown.contains(e.target as Node)
    ) {
      methodDropdown.classList.add("hidden");
      methodArrow.classList.remove("rotate-180");
    }
    if (
      !clientMethodTrigger.contains(e.target as Node) &&
      !clientMethodDropdown.contains(e.target as Node)
    ) {
      clientMethodDropdown.classList.add("hidden");
      clientMethodArrow.classList.remove("rotate-180");
    }
    if (
      !clientTabTrigger.contains(e.target as Node) &&
      !clientTabDropdown.contains(e.target as Node)
    ) {
      clientTabDropdown.classList.add("hidden");
      clientTabArrow.classList.remove("rotate-180");
    }
  });

  clientTabTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    clientTabDropdown.classList.toggle("hidden");
    clientTabArrow.classList.toggle("rotate-180");
  });

  const refreshTabsList = async () => {
    const allTabs = await chrome.tabs.query({});
    const validTabs = allTabs.filter(
      (tab) =>
        tab.url &&
        (tab.url.startsWith("http://") || tab.url.startsWith("https://")),
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
      try {
        domain = new URL(tab.url!).hostname;
      } catch (e) {}

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

  const updateResponseEditor = (text: string, status: number) => {
    clientResponseEditor.dispatch({
      changes: {
        from: 0,
        to: clientResponseEditor.state.doc.length,
        insert: text,
      },
    });
    clientStatusSpan.textContent = `STATUS: ${status || "ERROR"}`;
    if (status >= 200 && status < 300) {
      clientStatusSpan.className =
        "font-mono text-[11px] px-2.5 py-1 rounded-md bg-green-500/20 text-green-400";
    } else {
      clientStatusSpan.className =
        "font-mono text-[11px] px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400";
    }
  };

  clientSendBtn.addEventListener("click", async () => {
    const targetUrl = clientUrlInput.value.trim();
    const method = clientMethodInput.value;
    const bodyText = clientBodyEditor.state.doc.toString().trim();

    if (!targetUrl) {
      alert("Please enter a valid Target URL!");
      return;
    }

    clientSendBtn.disabled = true;
    clientSendBtn.textContent = "Executing via Tab...";
    clientStatusSpan.textContent = "STATUS: LOADING";
    clientStatusSpan.className =
      "font-mono text-[11px] px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-400";

    try {
      const selectedTabId = parseInt(clientTabInput.value);

      if (!selectedTabId || isNaN(selectedTabId)) {
        throw new Error(
          "Please select a valid Execution Context (Browser Tab) from the dropdown.",
        );
      }

      chrome.tabs.sendMessage(
        selectedTabId,
        {
          action: "SAFEHIT_EXECUTE_CLIENT_REQUEST",
          payload: { method, url: targetUrl, body: bodyText },
        },
        (response) => {
          clientSendBtn.disabled = false;
          clientSendBtn.textContent = "Execute Request";

          if (chrome.runtime.lastError || !response) {
            const errMsg =
              chrome.runtime.lastError?.message ||
              "Failed to communicate with tab. Make sure the page is fully loaded.";
            updateResponseEditor(`// Error: ${errMsg}`, 500);
            return;
          }

          if (response.success) {
            const stringifiedResult =
              typeof response.data === "object"
                ? JSON.stringify(response.data, null, 2)
                : response.data;
            updateResponseEditor(stringifiedResult, response.status);
          } else {
            updateResponseEditor(
              `// Request Failed\n${JSON.stringify(response.data, null, 2)}`,
              response.status,
            );
          }
        },
      );
    } catch (error: any) {
      clientSendBtn.disabled = false;
      clientSendBtn.textContent = "Execute Request";
      updateResponseEditor(`// Error:\n${error.message}`, 0);
    }
  });

  renderMocks();
});
