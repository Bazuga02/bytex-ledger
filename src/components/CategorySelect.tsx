"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";

export function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value) ?? categories[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-surface-container-high px-3 py-3 text-left transition-colors ${
          open
            ? "border-primary-fixed"
            : "border-outline-variant hover:border-outline"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: selected.color }}
            />
          )}
          <span className="truncate text-sm text-white">
            {selected?.name ?? "Select category"}
          </span>
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        >
          {categories.length === 0 ? (
            <li className="px-3 py-2 text-sm text-on-surface-variant">
              No categories
            </li>
          ) : (
            categories.map((c) => {
              const active = c.id === value;
              return (
                <li key={c.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-surface-variant text-primary-fixed"
                        : "text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: c.color }}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    {active && (
                      <span
                        className="material-symbols-outlined text-[16px] text-primary-fixed"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
