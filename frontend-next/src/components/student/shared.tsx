"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/layout/icons";

export function Spinner({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`animate-spin inline-block ${className} border-2 border-blue-600 border-t-transparent rounded-full`} />
  );
}

export function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="text-center py-4">
      <Spinner />
      <p className="mt-2 text-gray-600">{text}</p>
    </div>
  );
}

export function EmptyState({ text, card = "rounded-xl shadow-lg" }: { text: string; card?: string }) {
  return (
    <div className={`bg-white ${card} p-8 text-center text-gray-500 border border-gray-100 flex flex-col items-center justify-center gap-3`}>
      <Icon name="inbox" className="w-12 h-12 text-gray-300" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

/** Centered page title + subtitle used by most student pages. */
export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-4xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );
}

interface SelectDef {
  value: string;
  onChange: (v: string) => void;
  options: [value: string, label: string][];
}

const FIELD =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-accent transition-all";

/** The "Search & Filters" bar shared by courses / attendance / quizzes / assignments. */
export function FilterBar({
  search,
  onSearch,
  placeholder,
  selects,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  selects: SelectDef[];
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
      <div className="md:col-span-2 relative">
        <Icon name="search" className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />
      </div>
      {selects.map((s, i) => (
        <div key={i}>
          <select value={s.value} onChange={(e) => s.onChange(e.target.value)} className={FIELD}>
            {s.options.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <div className="text-red-600">{children}</div>;
}
