// src/popup/popup.ts
import "../styles/tailwind.css";
import { StorageHelper } from "../utils/storage";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements (Safeguard)
  const urlInput = document.getElementById("url-input") as HTMLInputElement;
  const addBtn = document.getElementById("add-btn") as HTMLButtonElement;
  const urlList = document.getElementById("url-list") as HTMLDivElement;

  // DOM Elements (Tabs & Mocking)
  const btnTabSafeguard = document.getElementById(
    "btn-tab-safeguard",
  ) as HTMLButtonElement;
  const btnTabMocking = document.getElementById(
    "btn-tab-mocking",
  ) as HTMLButtonElement;
  const contentSafeguard = document.getElementById(
    "content-safeguard",
  ) as HTMLDivElement;
  const contentMocking = document.getElementById(
    "content-mocking",
  ) as HTMLDivElement;
  const openMockDashboardBtn = document.getElementById(
    "open-mock-dashboard",
  ) as HTMLButtonElement;
  const mockCountSpan = document.getElementById(
    "mock-count",
  ) as HTMLSpanElement;

  // ==========================================
  // TAB SWITCHING LOGIC
  // ==========================================
  const switchTab = (tab: "safeguard" | "mocking") => {
    if (tab === "safeguard") {
      btnTabSafeguard.className =
        "flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-white shadow-sm transition-all";
      btnTabMocking.className =
        "flex-1 py-1.5 text-xs font-semibold rounded-lg text-zinc-500 hover:text-white transition-all";
      contentSafeguard.classList.remove("hidden");
      contentMocking.classList.add("hidden");
    } else {
      btnTabMocking.className =
        "flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-white shadow-sm transition-all";
      btnTabSafeguard.className =
        "flex-1 py-1.5 text-xs font-semibold rounded-lg text-zinc-500 hover:text-white transition-all";
      contentMocking.classList.remove("hidden");
      contentSafeguard.classList.add("hidden");
    }
  };

  btnTabSafeguard.addEventListener("click", () => switchTab("safeguard"));
  btnTabMocking.addEventListener("click", () => switchTab("mocking"));

  // ==========================================
  // MOCKING DASHBOARD LOGIC
  // ==========================================
  if (openMockDashboardBtn) {
    openMockDashboardBtn.addEventListener("click", () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL("src/options/index.html"));
      }
    });
  }

  // ==========================================
  // RENDER DATA (Safeguard & Mock Count)
  // ==========================================
  const renderData = async () => {
    const config = await StorageHelper.getConfig();

    // 1. Update Mock Count
    if (mockCountSpan) {
      mockCountSpan.textContent = (config.mockRules?.length || 0).toString();
    }

    // 2. Update Safeguard List
    urlList.innerHTML = "";

    if (config.blockedUrls.length === 0) {
      urlList.innerHTML = `
        <div class="flex flex-col items-center justify-center py-6 opacity-50">
          <svg class="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
          <span class="text-[10px]">No URLs protected yet</span>
        </div>
      `;
      return;
    }

    config.blockedUrls.forEach((rule) => {
      const item = document.createElement("div");
      item.className = `flex justify-between items-center bg-white/[0.04] p-2 rounded-lg border transition-all ${rule.active ? "border-white/10" : "border-white/5 opacity-50"}`;

      item.innerHTML = `
        <span class="text-xs font-mono truncate mr-2 ${rule.active ? "text-zinc-200" : "text-zinc-600 line-through"}">${rule.url}</span>
        <div class="flex items-center gap-2">
          <button data-url="${rule.url}" class="toggle-btn relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${rule.active ? "bg-violet-500" : "bg-white/20"}">
            <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rule.active ? "translate-x-4" : "translate-x-0.5"}"></span>
          </button>
          
          <button data-url="${rule.url}" class="delete-btn text-zinc-500 hover:text-red-400 transition-colors p-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;
      urlList.appendChild(item);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const urlToRemove = (e.currentTarget as HTMLButtonElement).dataset.url;
        if (urlToRemove) {
          const newConfig = {
            ...config,
            blockedUrls: config.blockedUrls.filter(
              (u) => u.url !== urlToRemove,
            ),
          };
          await StorageHelper.saveConfig(newConfig);
          renderData();
        }
      });
    });

    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const urlToToggle = (e.currentTarget as HTMLButtonElement).dataset.url;
        if (urlToToggle) {
          const newUrls = config.blockedUrls.map((u) =>
            u.url === urlToToggle ? { ...u, active: !u.active } : u,
          );
          await StorageHelper.saveConfig({ ...config, blockedUrls: newUrls });
          renderData();
        }
      });
    });
  };

  // ==========================================
  // ADD SAFEGUARD RULE LOGIC
  // ==========================================
  addBtn.addEventListener("click", async () => {
    const newUrl = urlInput.value.trim();
    if (newUrl) {
      const config = await StorageHelper.getConfig();

      const isExist = config.blockedUrls.some((u) => u.url === newUrl);

      if (!isExist) {
        const newRule = { url: newUrl, active: true };
        await StorageHelper.saveConfig({
          ...config,
          blockedUrls: [...config.blockedUrls, newRule],
        });

        urlInput.value = "";
        renderData();
      }
    }
  });

  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBtn.click();
  });

  renderData();
});
