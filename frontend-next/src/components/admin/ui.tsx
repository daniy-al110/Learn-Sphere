"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const HEAD_BG: CSSProperties = { background: "linear-gradient(135deg, #1a1a2e, #16213e)" };
export const TH = "px-6 py-3 border-b text-left text-sm font-semibold text-white";
export const FIELD = "w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent";
export const NO_MARGIN: CSSProperties = { marginBottom: 0 };
/** Inline "pill" buttons in the directory tables (they override the global form-button styling). */
export const PILL = "font-semibold px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap";
export const pillStyle = (bg: string, color: string): CSSProperties => ({
  background: bg, color, border: "none", width: "auto", display: "inline-flex", marginBottom: 0,
});

/** Port of showTempMessage(): a non-blocking message under a form that clears after 4s. */
export function useTempMessage() {
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string, error: boolean) => {
    clearTimeout(timer.current);
    setMsg({ text, error });
    timer.current = setTimeout(() => setMsg(null), 4000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = msg ? (
    <div style={{ color: msg.error ? "#b91c1c" : "#065f46", marginTop: 8, fontSize: "0.95rem" }}>{msg.text}</div>
  ) : null;
  return { show, node };
}

export function EmptyRow({ colSpan, text, icon }: { colSpan: number; text: string; icon?: boolean }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-400">
        <div className="flex flex-col items-center gap-2">
          {icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
          <span>{text}</span>
        </div>
      </td>
    </tr>
  );
}

export const rowClass = (i: number) => (i % 2 === 0 ? "bg-white hover:bg-pink-50 transition" : "bg-gray-50 hover:bg-pink-50 transition");

export function Chips({ items, bg, color, border }: { items?: { course_name?: string, section_name?: string }[]; bg: string; color: string; border: string }) {
  if (!items || !items.length) return <span className="text-sm text-gray-400">No courses</span>;
  return (
    <>
      {items.map((c, i) => (
        <span key={i} className="inline-flex items-center rounded-md px-3 py-1 text-xs font-bold mr-2 mb-2" style={{ background: bg, color, border: `1px solid ${border}` }}>
          {c.course_name || "Untitled Course"}{c.section_name ? ` (${c.section_name})` : ""}
        </span>
      ))}
    </>
  );
}

export function Avatar({ letter, bg }: { letter: string; bg: string }) {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: bg }}>
      {letter.toUpperCase()}
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-4 rounded-lg shadow-xs transition cursor-pointer"
      style={{ backgroundColor: "#e94560" }}
    >
      {children}
    </button>
  );
}

export const PLUS_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-semibold py-2 px-4 rounded-lg shadow-xs transition cursor-pointer"
      style={{ background: "none", border: "1px solid #e94560", color: "#e94560" }}
    >
      ← Back to List
    </button>
  );
}

export function SubmitSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
