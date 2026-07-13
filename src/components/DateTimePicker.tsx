"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function toLocalValue(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function fromLocalValue(value: string): Date {
  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function DateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fromLocalValue(value), [value]);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setViewMonth(startOfMonth(selected));
  }, [open, selected]);

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

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  function pickDay(day: Date) {
    const next = setMinutes(
      setHours(day, selected.getHours()),
      selected.getMinutes(),
    );
    onChange(toLocalValue(next));
  }

  function pickHour(hour: number) {
    onChange(toLocalValue(setHours(selected, hour)));
  }

  function pickMinute(minute: number) {
    onChange(toLocalValue(setMinutes(selected, minute)));
  }

  const display = format(selected, "dd MMM yy · HH:mm");
  const selectedMinute =
    MINUTES.includes(selected.getMinutes())
      ? selected.getMinutes()
      : MINUTES.reduce((prev, m) =>
          Math.abs(m - selected.getMinutes()) <
          Math.abs(prev - selected.getMinutes())
            ? m
            : prev,
        );

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
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="font-data min-w-0 flex-1 whitespace-nowrap text-sm text-white">
          {display}
        </span>
        <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant">
          calendar_today
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick date and time"
          className="absolute right-0 z-[80] mt-2 w-[min(100vw-2rem,320px)] rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_16px_48px_rgba(0,0,0,0.65)] sm:w-[340px]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
              aria-label="Previous month"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>
            <p className="font-display text-sm font-semibold text-white">
              {format(viewMonth, "MMMM yyyy")}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
              aria-label="Next month"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div
                key={d}
                className="font-label py-1 text-center text-[10px] text-on-surface-variant"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="mb-3 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const active = isSameDay(day, selected);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={`font-data flex h-9 items-center justify-center rounded-lg text-sm transition ${
                    active
                      ? "bg-primary-fixed font-bold text-on-primary-container"
                      : inMonth
                        ? "text-on-surface hover:bg-surface-container"
                        : "text-on-surface-variant/35 hover:bg-surface-container/50"
                  } ${isToday && !active ? "ring-1 ring-primary/40" : ""}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="border-t border-outline-variant/40 pt-3">
            <p className="font-label mb-2 text-[10px] text-on-surface-variant">
              Time
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-[10px] text-on-surface-variant">Hour</p>
                <div className="ledger-scroll max-h-28 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-high p-1">
                  {HOURS.map((h) => {
                    const active = selected.getHours() === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => pickHour(h)}
                        className={`font-data w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${
                          active
                            ? "bg-primary-fixed/20 text-primary-fixed"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                        }`}
                      >
                        {format(setHours(new Date(), h), "h a")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-on-surface-variant">
                  Minute
                </p>
                <div className="flex flex-col gap-1 rounded-xl border border-outline-variant/40 bg-surface-container-high p-1">
                  {MINUTES.map((m) => {
                    const active = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => pickMinute(m)}
                        className={`font-data w-full rounded-lg px-2 py-2 text-left text-xs transition ${
                          active
                            ? "bg-primary-fixed/20 text-primary-fixed"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                        }`}
                      >
                        :{String(m).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onChange(toLocalValue(new Date()))}
              className="rounded-lg px-3 py-2 font-label text-[10px] text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary-fixed px-4 py-2 font-label text-[10px] text-on-primary-container transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
