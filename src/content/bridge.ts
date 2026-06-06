import { StorageHelper } from '../utils/storage';

const syncConfigToMainWorld = async () => {
  const config = await StorageHelper.getConfig();
  window.postMessage({
    source: 'SAFEHIT_BRIDGE',
    payload: config
  }, '*');
};

syncConfigToMainWorld();

chrome.storage.onChanged.addListener((changes: any, namespace: string) => {
  if (namespace === 'sync' && changes.safeHitConfig) {
    window.postMessage({
      source: 'SAFEHIT_BRIDGE',
      payload: changes.safeHitConfig.newValue
    }, '*');
  }
});