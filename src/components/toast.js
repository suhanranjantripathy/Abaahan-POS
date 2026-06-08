/**
 * Lightweight zero-dependency toast system.
 * Usage: import { toast } from '../components/toast';
 *        toast.success('Done!');  toast.error('Oops!');  toast.info('FYI');
 */

const CONTAINER_ID = 'toast-root';
const DEFAULT_DURATION = 4000;

function getContainer() {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
      pointer-events: none; font-family: inherit;
    `;
    document.body.appendChild(el);
  }
  return el;
}

const COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a', text: '#166534' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', text: '#991b1b' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb', text: '#1e40af' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706', text: '#92400e' },
};

const ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

function show(message, type = 'info', duration = DEFAULT_DURATION) {
  const container = getContainer();
  const c = COLORS[type] || COLORS.info;
  const id = `toast-${Date.now()}-${Math.random()}`;

  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = `
    display: flex; align-items: flex-start; gap: 10px;
    background: ${c.bg}; border: 1.5px solid ${c.border};
    color: ${c.text}; border-radius: 14px; padding: 12px 16px;
    max-width: 360px; min-width: 240px;
    font-size: 14px; font-weight: 600; line-height: 1.4;
    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    pointer-events: all; cursor: pointer;
    transform: translateX(120%); transition: transform 0.3s cubic-bezier(.175,.885,.32,1.275), opacity 0.3s;
    opacity: 0;
  `;

  el.innerHTML = `
    <span style="color:${c.icon}; flex-shrink:0; margin-top:1px">${ICONS[type]}</span>
    <span style="flex:1">${message}</span>
  `;

  el.addEventListener('click', () => dismiss(el));
  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'translateX(0)';
      el.style.opacity = '1';
    });
  });

  // Auto-dismiss
  const timer = setTimeout(() => dismiss(el), duration);
  el._timer = timer;

  return id;
}

function dismiss(el) {
  if (!el || !el.parentNode) return;
  clearTimeout(el._timer);
  el.style.transform = 'translateX(120%)';
  el.style.opacity = '0';
  setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 350);
}

export const toast = {
  success: (msg, dur) => show(msg, 'success', dur),
  error:   (msg, dur) => show(msg, 'error',   dur),
  info:    (msg, dur) => show(msg, 'info',    dur),
  warning: (msg, dur) => show(msg, 'warning', dur),
};
