import "../styles/tailwind.css";
import { StorageHelper, SafeHitConfig } from "../utils/storage";

document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url-input") as HTMLInputElement;
  const addBtn = document.getElementById("add-btn") as HTMLButtonElement;
  const urlList = document.getElementById("url-list") as HTMLUListElement;

  const renderUrls = async () => {
    const config: SafeHitConfig = await StorageHelper.getConfig();
    urlList.innerHTML = "";

    if (config.blockedUrls.length === 0) {
      urlList.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-6">
          <svg class="w-8 h-8 mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
          <p class="text-[12px] text-zinc-400 font-medium">No URLs protected yet</p>
        </div>
      `;
      return;
    }

    config.blockedUrls.forEach((url) => {
      const li = document.createElement("div");
      li.className =
        "group flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 px-4 py-3 rounded-xl transition-all cursor-default";

      li.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
          <span class="text-zinc-200 font-medium text-[12px] truncate" title="${url}">${url}</span>
        </div>
        <button data-url="${url}" class="delete-btn opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      `;
      urlList.appendChild(li);
    });

    // Reattach event listeners for delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const targetUrl = (e.currentTarget as HTMLButtonElement).dataset.url;
        if (targetUrl) {
          const newConfig = {
            ...config,
            blockedUrls: config.blockedUrls.filter((u) => u !== targetUrl),
          };
          await StorageHelper.saveConfig(newConfig);
          renderUrls();
        }
      });
    });
  };

  addBtn.addEventListener("click", async () => {
    const newUrl = urlInput.value.trim();
    if (!newUrl) return;
    const config = await StorageHelper.getConfig();
    if (!config.blockedUrls.includes(newUrl)) {
      await StorageHelper.saveConfig({
        ...config,
        blockedUrls: [...config.blockedUrls, newUrl],
      });
      urlInput.value = "";
      renderUrls();
    }
  });

  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBtn.click();
  });

  renderUrls();
});
