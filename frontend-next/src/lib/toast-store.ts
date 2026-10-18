/**
 * Tiny external store that replaces the global `Toast` / `LmsModal` objects from lms-ui.js.
 * `toast.error("...")` and `confirmDialog.confirm({...})` can be called from any client code
 * (handlers, hooks, api helpers) with the same signatures as before; <ToastViewport/> and
 * <ConfirmModalHost/> (mounted once in the root layout) render them.
 */

export type ToastType = "success" | "error" | "warning" | "info";
export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const EMPTY_TOASTS: ToastItem[] = [];
let toasts: ToastItem[] = EMPTY_TOASTS;
let nextId = 1;
const toastListeners = new Set<() => void>();
const emitToasts = () => toastListeners.forEach((l) => l());

export const subscribeToasts = (l: () => void) => {
  toastListeners.add(l);
  return () => {
    toastListeners.delete(l);
  };
};
export const getToasts = () => toasts;
export const getServerToasts = () => EMPTY_TOASTS;

export function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emitToasts();
}

function show(message: string, type: ToastType = "info", duration = 4000) {
  toasts = [...toasts, { id: nextId++, message, type, duration }];
  emitToasts();
}

export const toast = {
  show,
  success: (msg: string, dur?: number) => show(msg, "success", dur),
  error: (msg: string, dur?: number) => show(msg, "error", dur),
  warning: (msg: string, dur?: number) => show(msg, "warning", dur),
  info: (msg: string, dur?: number) => show(msg, "info", dur),
};

/* ───────────── Confirmation modal ───────────── */

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}
export interface ConfirmState {
  id: number;
  options: Required<ConfirmOptions>;
  resolve: (result: boolean) => void;
}

let confirmState: ConfirmState | null = null;
const confirmListeners = new Set<() => void>();
const emitConfirm = () => confirmListeners.forEach((l) => l());

export const subscribeConfirm = (l: () => void) => {
  confirmListeners.add(l);
  return () => {
    confirmListeners.delete(l);
  };
};
export const getConfirmState = () => confirmState;
export const getServerConfirmState = () => null;
export function clearConfirm() {
  confirmState = null;
  emitConfirm();
}

function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  // Opening a new modal replaces any existing one (as the vanilla version did).
  confirmState?.resolve(false);
  return new Promise<boolean>((resolve) => {
    confirmState = {
      id: nextId++,
      options: {
        title: options.title || "Confirm",
        message: options.message || "Are you sure?",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        type: options.type || "info",
      },
      resolve,
    };
    emitConfirm();
  });
}

function confirmDelete(options: ConfirmOptions & { entityName?: string } = {}) {
  return confirm({
    title: options.title || "Confirm Deletion",
    message:
      options.message ||
      `Are you sure you want to delete ${options.entityName || "this item"}? This action cannot be undone.`,
    confirmText: options.confirmText || "Delete",
    cancelText: options.cancelText || "Cancel",
    type: "danger",
  });
}

export const confirmDialog = { confirm, confirmDelete };
