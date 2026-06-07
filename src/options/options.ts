// src/options/options.ts
import "../styles/tailwind.css";
import { StorageHelper, SafeHitConfig, MockRule } from "../utils/storage";

document.addEventListener("DOMContentLoaded", () => {
  const methodInput = document.getElementById(
    "mock-method",
  ) as HTMLSelectElement;
  const urlInput = document.getElementById("mock-url") as HTMLInputElement;
  const statusInput = document.getElementById(
    "mock-status",
  ) as HTMLInputElement;
  const bodyInput = document.getElementById("mock-body") as HTMLTextAreaElement;
  const addBtn = document.getElementById("add-mock-btn") as HTMLButtonElement;
  const mockList = document.getElementById("mock-list") as HTMLDivElement;

  const renderMocks = async () => {
    const config: SafeHitConfig = await StorageHelper.getConfig();
    mockList.innerHTML = "";

    if (!config.mockRules || config.mockRules.length === 0) {
      mockList.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl p-12 text-center">
          <p class="text-zinc-500 font-medium">No mock rules configured yet.</p>
          <p class="text-xs text-zinc-600 mt-1">Add a new rule from the panel to get started.</p>
        </div>
      `;
      return;
    }

    config.mockRules.forEach((rule) => {
      const card = document.createElement("div");
      card.className =
        "group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all relative overflow-hidden";

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
            <span class="font-mono text-sm text-zinc-200">${rule.url}</span>
          </div>
          <button data-id="${rule.id}" class="delete-btn text-zinc-500 hover:text-rose-400 transition-colors p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
        <div class="bg-black/50 rounded-xl p-3">
          <div class="text-[10px] text-zinc-500 mb-1 uppercase font-bold tracking-wider">Status: <span class="text-zinc-300">${rule.status}</span></div>
          <pre class="text-xs font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap">${rule.responseBody}</pre>
        </div>
      `;
      mockList.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const newConfig = {
          ...config,
          mockRules: config.mockRules.filter((r) => r.id !== id),
        };
        await StorageHelper.saveConfig(newConfig);
        renderMocks();
      });
    });
  };

  addBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    const body = bodyInput.value.trim();

    if (!url || !body) {
      alert("URL and Response Body are required!");
      return;
    }

    const newRule: MockRule = {
      id: Date.now().toString(),
      method: methodInput.value,
      url: url,
      status: parseInt(statusInput.value) || 200,
      responseBody: body,
    };

    const config = await StorageHelper.getConfig();
    const mockRules = config.mockRules || [];
    await StorageHelper.saveConfig({
      ...config,
      mockRules: [...mockRules, newRule],
    });

    // Reset Form
    urlInput.value = "";
    bodyInput.value = "";
    statusInput.value = "200";
    renderMocks();
  });

  renderMocks();
});
