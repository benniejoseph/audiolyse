/**
 * Unified Toast Notification System
 * Provides consistent toast notifications across the app
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  dismissible?: boolean;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(124,255,199,0.2)', border: 'rgba(124,255,199,0.3)', icon: '#7cffc7' },
  error: { bg: 'rgba(255,107,107,0.2)', border: 'rgba(255,107,107,0.3)', icon: '#ff6b6b' },
  warning: { bg: 'rgba(255,209,102,0.2)', border: 'rgba(255,209,102,0.3)', icon: '#ffd166' },
  info: { bg: 'rgba(0,217,255,0.2)', border: 'rgba(0,217,255,0.3)', icon: '#00d9ff' },
};

let toastContainer: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (typeof window === 'undefined') {
    throw new Error('Toast can only be used in browser');
  }

  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  // Create container
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 420px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);

  // Add styles if not present
  if (!document.getElementById('toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-radius: 12px;
        background: rgba(20,20,30,0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        animation: toastSlideIn 0.3s ease-out;
        pointer-events: auto;
      }
      @keyframes toastSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toastSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .toast-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        flex-shrink: 0;
      }
      .toast-message {
        flex: 1;
        color: #fff;
        font-size: 14px;
        line-height: 1.4;
      }
      .toast-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .toast-close:hover {
        color: #fff;
        background: rgba(255,255,255,0.1);
      }
    `;
    document.head.appendChild(styles);
  }

  return toastContainer;
}

function createToastElement(
  message: string,
  type: ToastType,
  options: ToastOptions = {}
): HTMLDivElement {
  const { dismissible = true } = options;
  const colors = TOAST_COLORS[type];
  const icon = TOAST_ICONS[type];

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = colors.border;

  const iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  iconEl.style.background = colors.bg;
  iconEl.style.color = colors.icon;
  iconEl.textContent = icon;

  const messageEl = document.createElement('span');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(messageEl);

  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => dismissToast(toast);
    toast.appendChild(closeBtn);
  }

  return toast;
}

function dismissToast(toast: HTMLDivElement): void {
  toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
  setTimeout(() => toast.remove(), 300);
}

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
): void {
  const { duration = 6000 } = options;
  
  try {
    const container = ensureContainer();
    const toast = createToastElement(message, type, options);
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          dismissToast(toast);
        }
      }, duration);
    }
  } catch (e) {
    // Fallback to console in SSR
    console.log(`[Toast ${type}] ${message}`);
  }
}

// Convenience methods
export const toast = {
  success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
  warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
  info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
};

export default toast;
