import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export const toasts = writable<Toast[]>([]);

export function addToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = crypto.randomUUID();
  toasts.update((all) => [...all, { id, message, type, duration }]);
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

export function removeToast(id: string) {
  toasts.update((all) => all.filter((t) => t.id !== id));
}

export const toast = {
  success: (msg: string, duration?: number) => addToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => addToast(msg, 'error', duration ?? 6000),
  warning: (msg: string, duration?: number) => addToast(msg, 'warning', duration),
  info: (msg: string, duration?: number) => addToast(msg, 'info', duration),
};
