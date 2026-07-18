import { StorageHelper, SafeHitConfig, MatchType } from "../utils/storage";
import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { showToast } from "../utils/toast";

const DEFAULT_JSON = '{\n  "success": true,\n  "data": []\n}';

export const initMockingEngine = () => {
  const methodInput = document.getElementById("mock-method") as HTMLInputElement;
  const urlInput = document.getElementById("mock-url") as HTMLInputElement;
  const statusInput = document.getElementById("mock-status") as HTMLInputElement;
  const matchTypeSelect = document.getElementById("mock-match-type") as HTMLSelectElement;
  const addBtn = document.getElementById("add-mock-btn") as HTMLButtonElement;
  const mockList = document.getElementById("mock-list") as HTMLDivElement;
  const editorContainer = document.getElementById("mock-body-editor") as HTMLDivElement;

  const methodTrigger = document.getElementById("method-trigger") as HTMLButtonElement;
  const methodDropdown = document.getElementById("method-dropdown") as HTMLDivElement;
  const methodSelectedText = document.getElementById("method-selected-text") as HTMLSpanElement;
  const methodArrow = document.getElementById("method-arrow") as HTMLElement;
  const methodOptions = document.querySelectorAll(".method-option");

  let editingRuleId: string | null = null;

  const bodyEditor = new EditorView({
    doc: DEFAULT_JSON,
    extensions: [basicSetup, json(), oneDark],
    parent: editorContainer,
  });

  const readOnlyEditors = new Map<string, EditorView>();

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
    matchTypeSelect.value = "contains";
    updateMethodColor("GET");
    editingRuleId = null;
    bodyEditor.dispatch({
      changes: { from: 0, to: bodyEditor.state.doc.length, insert: DEFAULT_JSON },
    });
    addBtn.textContent = "Save Mock Rule";
    addBtn.className =
      "w-full bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-2 shadow-lg shadow-violet-900/20";
  };

  const renderMocks = async () => {
    const config: SafeHitConfig = await StorageHelper.getConfig();

    readOnlyEditors.forEach((view) => view.destroy());
    readOnlyEditors.clear();
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
      const isActiveClass = rule.active ? "border-white/10 opacity-100" : "border-white/5 opacity-50";
      card.className = `group bg-white/[0.02] border hover:border-white/20 rounded-2xl p-5 transition-all relative overflow-hidden ${isActiveClass}`;
      const methodColor =
        rule.method === "GET" ? "text-blue-400"
        : rule.method === "POST" ? "text-green-400"
        : rule.method === "DELETE" ? "text-red-400"
        : "text-yellow-400";
      const matchTypeLabel =
        rule.matchType === "exact" ? "EXACT"
        : rule.matchType === "regex" ? "REGEX"
        : "CONTAINS";
      const matchTypeColor =
        rule.matchType === "exact" ? "text-emerald-400 bg-emerald-500/10"
        : rule.matchType === "regex" ? "text-amber-400 bg-amber-500/10"
        : "text-zinc-400 bg-white/5";

      card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <span class="font-bold text-[11px] px-2 py-1 bg-black/40 rounded-md ${methodColor}">${rule.method}</span>
            <span class="font-bold text-[9px] px-1.5 py-0.5 rounded ${matchTypeColor}">${matchTypeLabel}</span>
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

      const viewContainer = document.getElementById(`cm-view-${rule.id}`) as HTMLDivElement;
      const editorView = new EditorView({
        doc: rule.responseBody,
        extensions: [basicSetup, json(), oneDark, EditorView.editable.of(false), EditorView.lineWrapping],
        parent: viewContainer,
      });
      readOnlyEditors.set(rule.id, editorView);
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
        const ruleToDelete = config.mockRules.find((r) => r.id === id);
        if (ruleToDelete && !confirm(`Delete mock rule for ${ruleToDelete.method} ${ruleToDelete.url}?`)) {
          return;
        }
        const newConfig = { ...config, mockRules: config.mockRules.filter((r) => r.id !== id) };
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
          matchTypeSelect.value = ruleToEdit.matchType || "contains";
          bodyEditor.dispatch({
            changes: { from: 0, to: bodyEditor.state.doc.length, insert: ruleToEdit.responseBody },
          });
          editingRuleId = ruleToEdit.id;
          addBtn.textContent = "Update Mock Rule";
          addBtn.className =
            "w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-2 shadow-lg shadow-blue-900/20";
          document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  };

  addBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    const body = bodyEditor.state.doc.toString().trim();
    const matchType = (matchTypeSelect.value || "contains") as MatchType;
    if (!url || !body) {
      showToast("URL and Response Body are required!", "warning");
      return;
    }
    if (matchType === "regex") {
      try { new RegExp(url); } catch {
        showToast("Invalid regex pattern!", "error");
        return;
      }
    }
    const config = await StorageHelper.getConfig();
    let mockRules = config.mockRules || [];
    if (editingRuleId) {
      mockRules = mockRules.map((rule) =>
        rule.id === editingRuleId
          ? { ...rule, method: methodInput.value, url, status: parseInt(statusInput.value) || 200, responseBody: body, matchType }
          : rule,
      );
    } else {
      mockRules.push({
        id: Date.now().toString(),
        method: methodInput.value,
        url,
        status: parseInt(statusInput.value) || 200,
        responseBody: body,
        active: true,
        matchType,
      });
    }
    await StorageHelper.saveConfig({ ...config, mockRules });
    resetForm();
    renderMocks();
  });

  return { renderMocks, methodTrigger, methodDropdown, methodArrow };
};
