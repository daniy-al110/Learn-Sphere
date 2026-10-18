"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./Modal.module.css";
import {
  clearConfirm,
  getConfirmState,
  getServerConfirmState,
  subscribeConfirm,
  type ConfirmState,
} from "@/lib/toast-store";

const EXIT_MS = 250;
const iconStroke = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function ModalIcon({ type }: { type: "danger" | "warning" | "info" }) {
  if (type === "danger")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" stroke="#ef4444" {...iconStroke}>
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    );
  if (type === "warning")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" stroke="#f59e0b" {...iconStroke}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" stroke="#e94560" {...iconStroke}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function Modal({ state }: { state: ConfirmState }) {
  const { options, resolve } = state;
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const close = (result: boolean) => {
    if (leaving) return;
    setLeaving(true);
    resolve(result); // resolve immediately, like the vanilla version
    setTimeout(clearConfirm, EXIT_MS);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    confirmRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const t = cap(options.type);
  return (
    <div
      className={[styles.overlay, !entered ? styles.enter : "", leaving ? styles.exit : ""].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lms-modal-title"
      onClick={(e) => e.target === e.currentTarget && close(false)}
    >
      <div className={styles.card}>
        <div className={`${styles.header} ${styles["header" + t]}`}>
          <h3 id="lms-modal-title" className={styles.title}>{options.title}</h3>
          <button className={styles.headerClose} aria-label="Close dialog" onClick={() => close(false)}>&times;</button>
        </div>
        <div className={styles.bodyWrap}>
          <div className={styles.iconWrap}><ModalIcon type={options.type} /></div>
          <p className={styles.message}>{options.message}</p>
        </div>
        <div className={styles.footer}>
          <button className={`${styles.btn} ${styles.cancel}`} onClick={() => close(false)}>{options.cancelText}</button>
          <button ref={confirmRef} className={`${styles.btn} ${styles.confirm} ${styles["confirm" + t]}`} onClick={() => close(true)}>
            {options.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmModalHost() {
  const state = useSyncExternalStore(subscribeConfirm, getConfirmState, getServerConfirmState);
  // key forces a fresh modal (and entrance animation) when a new confirm replaces an old one
  return state ? <Modal key={state.id} state={state} /> : null;
}
