"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./Toast.module.css";
import {
  getServerToasts,
  getToasts,
  removeToast,
  subscribeToasts,
  type ToastItem,
  type ToastType,
} from "@/lib/toast-store";

const SLIDE_MS = 350;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg className={styles.icon} viewBox="0 0 24 24" {...stroke}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg className={styles.icon} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg className={styles.icon} viewBox="0 0 24 24" {...stroke}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className={styles.icon} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

function ToastView({ item }: { item: ToastItem }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // entrance animation on next frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // auto-dismiss after `duration`
  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), item.duration);
    return () => clearTimeout(t);
  }, [item.duration]);

  // remove from the store once the exit animation has played
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => removeToast(item.id), SLIDE_MS);
    return () => clearTimeout(t);
  }, [leaving, item.id]);

  const cls = [styles.toast, styles[item.type], leaving ? styles.exit : !entered ? styles.enter : ""].join(" ");

  return (
    <div className={cls} role="alert" aria-live="assertive">
      <div className={styles.body}>
        {ICONS[item.type]}
        <span className={styles.msg}>{item.message}</span>
      </div>
      <button className={styles.close} aria-label="Dismiss notification" onClick={() => setLeaving(true)}>
        &times;
      </button>
      <div className={styles.progress} style={{ animationDuration: `${item.duration}ms` }} />
    </div>
  );
}

export default function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <ToastView key={t.id} item={t} />
      ))}
    </div>
  );
}
