// src/content/interceptor.ts
import { showWarningModal } from './ui';
import { SafeHitConfig } from '../utils/storage';

// Inisialisasi config kosong, akan diisi oleh bridge.ts
let activeConfig: SafeHitConfig = { blockedUrls: [], mockRules: [] };

// Dengarkan pesan dari ISOLATED world
window.addEventListener('message', (event) => {
  if (event.data && event.data.source === 'SAFEHIT_BRIDGE') {
    activeConfig = event.data.payload;
    console.log('[SafeHit] Configuration synchronized:', activeConfig);
  }
});

// Timpa fetch aslinya
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const [resource, configObj] = args;
  const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';
  const method = (configObj?.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  // Gunakan activeConfig yang didapat dari postMessage
  const isProductionUrl = activeConfig.blockedUrls.some((u) => url.includes(u));

  if (isMutation && isProductionUrl) {
    const isConfirmed = await showWarningModal(method, url);
    if (!isConfirmed) return Promise.reject(new Error("Aborted by SafeHit"));
  }
  
  return originalFetch.apply(this, args);
};