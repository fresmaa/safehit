export type ToastType = "error" | "success" | "warning" | "info";

let toastContainer: HTMLDivElement | null = null;

const getContainer = (): HTMLDivElement => {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "safehit-toast-container";
    toastContainer.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:9999999;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  error: {
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.3)",
    icon: "text-red-400",
  },
  success: {
    bg: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.3)",
    icon: "text-green-400",
  },
  warning: {
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.3)",
    icon: "text-amber-400",
  },
  info: {
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.3)",
    icon: "text-blue-400",
  },
};

const icons: Record<ToastType, string> = {
  error: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  success: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
  warning: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
};

export const showToast = (message: string, type: ToastType = "info", duration = 4000): void => {
  const container = getContainer();
  const style = typeStyles[type];

  const toast = document.createElement("div");
  toast.style.cssText = `
    pointer-events:auto;
    display:flex;align-items:center;gap:10px;
    background:${style.bg};border:1px solid ${style.border};
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    border-radius:12px;padding:12px 16px;
    font-family:system-ui,-apple-system,sans-serif;
    font-size:13px;font-weight:500;color:#f4f4f5;
    box-shadow:0 8px 24px rgba(0,0,0,0.3);
    max-width:380px;
    animation:toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1);
    transition:opacity 0.2s ease,transform 0.2s ease;
  `;

  toast.innerHTML = `
    <span class="${style.icon}" style="flex-shrink:0;display:flex;">${icons[type]}</span>
    <span style="flex:1;line-height:1.4;">${message}</span>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 200);
  };

  setTimeout(remove, duration);
};

if (!document.getElementById("safehit-toast-styles")) {
  const style = document.createElement("style");
  style.id = "safehit-toast-styles";
  style.textContent = `
    @keyframes toastSlideIn {
      from { opacity:0; transform:translateX(20px); }
      to { opacity:1; transform:translateX(0); }
    }
  `;
  document.head.appendChild(style);
}
