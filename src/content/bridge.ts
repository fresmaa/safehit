// src/content/bridge.ts
import { StorageHelper } from '../utils/storage';

const syncConfigToMainWorld = async () => {
  const config = await StorageHelper.getConfig();
  window.postMessage({
    source: 'SAFEHIT_BRIDGE',
    payload: config
  }, '*');
};

// Eksekusi saat halaman pertama kali dimuat
syncConfigToMainWorld();

// 🟢 TAMBAHKAN BAGIAN INI: 
// Mendengarkan perubahan storage secara real-time dan langsung mengirimnya ke Interceptor
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.safeHitConfig) {
    window.postMessage({
      source: 'SAFEHIT_BRIDGE',
      payload: changes.safeHitConfig.newValue
    }, '*');
  }
});