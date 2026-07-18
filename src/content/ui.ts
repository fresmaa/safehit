import { t } from "../utils/i18n";

export const showWarningModal = (
  method: string,
  url: string,
): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.id = "safehit-root";
    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: "closed" });
    const wrapper = document.createElement("div");

    const titleId = "safehit-modal-title";
    const descId = "safehit-modal-desc";

    wrapper.innerHTML = `
      <style>
        :host {
          --brand-primary: #8b5cf6;
          --brand-hover: #7c3aed;
          --bg-base: rgba(9, 9, 11, 0.6);
          --bg-modal: rgba(24, 24, 27, 0.95);
          --text-main: #f4f4f5;
          --text-muted: #a1a1aa;
        }
        
        .overlay {
          position: fixed; inset: 0; z-index: 999999;
          background: var(--bg-base);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex; justify-content: center; align-items: center;
          font-family: system-ui, -apple-system, sans-serif;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal {
          background: var(--bg-modal);
          width: 100%; max-width: 440px;
          border-radius: 24px;
          padding: 40px;
          display: flex; flex-direction: column; align-items: center;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .icon-container {
          width: 72px; height: 72px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 50%;
          display: flex; justify-content: center; align-items: center;
          margin-bottom: 24px;
          box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.05);
          color: #fbbf24;
        }

        .title {
          color: var(--text-main);
          font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
          margin: 0 0 12px 0; text-align: center;
        }

        .info-box {
          background: rgba(0,0,0,0.2);
          width: 100%; padding: 20px;
          border-radius: 16px; text-align: center; margin-bottom: 32px;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .info-text { color: var(--text-muted); font-size: 15px; line-height: 1.5; margin: 0; }
        .method-badge { 
          color: #fbbf24; font-weight: 700; background: rgba(245, 158, 11, 0.1);
          padding: 2px 8px; border-radius: 6px; font-size: 13px;
        }
        
        .url-text { 
          display: block; margin-top: 12px; font-size: 13px; color: var(--text-main); 
          word-break: break-all; opacity: 0.8;
          background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px;
        }

        .btn-submit {
          background: var(--brand-primary); color: white;
          width: 100%; padding: 16px; border-radius: 14px;
          font-size: 16px; font-weight: 600; border: none; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.39);
        }
        .btn-submit:hover, .btn-submit:focus-visible { transform: translateY(-2px); background: var(--brand-hover); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.23); }
        .btn-submit:active { transform: translateY(0); }
        .btn-submit:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }

        .btn-cancel {
          background: transparent; color: var(--text-muted);
          border: none; margin-top: 16px; cursor: pointer;
          font-size: 14px; font-weight: 500; padding: 8px;
          transition: color 0.2s ease;
          border-radius: 8px;
        }
        .btn-cancel:hover, .btn-cancel:focus-visible { color: white; }
        .btn-cancel:focus-visible { outline: 2px solid var(--text-muted); outline-offset: 2px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpFade { 
          from { opacity: 0; transform: translateY(30px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
      </style>
      <div class="overlay">
        <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="${titleId}" aria-describedby="${descId}" tabindex="-1">
          <div class="icon-container">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
          </div>
          <h2 id="${titleId}" class="title">${t("title")}</h2>
          <div id="${descId}" class="info-box">
            <p class="info-text">
              ${t("warning")} <span class="method-badge">${method}</span> ${t("methodLabel")}
              <span class="url-text">${url}</span>
            </p>
          </div>
          <button id="btn-submit" class="btn-submit">${t("buttonProceed")}</button>
          <button id="btn-cancel" class="btn-cancel">${t("buttonCancel")}</button>
        </div>
      </div>
    `;
    shadow.appendChild(wrapper);

    const overlay = shadow.querySelector(".overlay") as HTMLElement;
    const btnSubmit = shadow.getElementById("btn-submit") as HTMLButtonElement;
    const btnCancel = shadow.getElementById("btn-cancel") as HTMLButtonElement;
    const focusableElements = [btnCancel, btnSubmit];
    let isClosing = false;

    const close = (result: boolean) => {
      if (isClosing) return;
      isClosing = true;

      document.removeEventListener("keydown", onKeyDown);
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.2s ease";
      setTimeout(() => {
        container.remove();
        resolve(result);
      }, 200);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close(false);
        return;
      }

      if (e.key === "Tab") {
        const currentIndex = focusableElements.indexOf(
          shadow.activeElement as HTMLButtonElement,
        );
        let nextIndex: number;

        if (e.shiftKey) {
          nextIndex =
            currentIndex <= 0
              ? focusableElements.length - 1
              : currentIndex - 1;
        } else {
          nextIndex =
            currentIndex >= focusableElements.length - 1
              ? 0
              : currentIndex + 1;
        }

        e.preventDefault();
        focusableElements[nextIndex].focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        close(false);
      }
    });

    btnCancel.addEventListener("click", () => close(false));
    btnSubmit.addEventListener("click", () => close(true));

    btnCancel.focus();
  });
};
