"use client";

import { useEffect, useMemo, useState } from "react";
import { formatINR } from "@/lib/money";
import type { ReplayPoint } from "@/lib/types";

export function CashflowReplay({
  points,
  spikeDay,
  loading,
}: {
  points: ReplayPoint[];
  spikeDay: string | null;
  loading: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const safeIndex =
    points.length === 0 ? 0 : Math.min(index, points.length - 1);
  const current = points[safeIndex];

  useEffect(() => {
    if (!playing || points.length === 0) return;
    const id = setInterval(() => {
      setIndex((prev) => {
        if (prev >= points.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 350);
    return () => clearInterval(id);
  }, [playing, points.length]);

  const { path, areaPath, minY, maxY, width, height } = useMemo(() => {
    const width = 1000;
    const height = 200;
    if (points.length === 0) {
      return { path: "", areaPath: "", minY: 0, maxY: 0, width, height };
    }
    const balances = points.map((p) => p.balanceCents);
    const minY = Math.min(...balances, 0);
    const maxY = Math.max(...balances, 0);
    const span = maxY - minY || 1;
    const step = points.length === 1 ? 0 : width / (points.length - 1);

    const coords = points.map((p, i) => {
      const x = i * step;
      const y = height - ((p.balanceCents - minY) / span) * (height - 24) - 12;
      return { x, y };
    });

    const path = `M${coords.map((c) => `${c.x},${c.y}`).join(" L")}`;
    const areaPath = `${path} L${width},${height} L0,${height} Z`;

    return { path, areaPath, minY, maxY, width, height };
  }, [points]);

  const cursorX =
    points.length <= 1 ? 0 : (safeIndex / (points.length - 1)) * width;

  const categoryEntries = current
    ? Object.entries(current.byCategory).sort(
        (a, b) => b[1].cents - a[1].cents,
      )
    : [];

  function jumpToSpike() {
    if (!spikeDay || points.length === 0) return;
    const i = points.findIndex((p) => p.date === spikeDay);
    if (i >= 0) {
      setPlaying(false);
      setIndex(i);
    }
  }

  const periodLabel =
    points.length > 0
      ? new Date(points[0].date + "T00:00:00Z").toLocaleString("en-IN", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : "—";

  if (loading) {
    return <div className="h-72 animate-pulse rounded-xl bg-surface-container-high" />;
  }

  if (points.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-sm text-on-surface-variant">
        Add transactions this month to unlock Cashflow Replay.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 className="font-display mb-2 text-[32px] font-semibold text-white">
            Cashflow Replay
          </h2>
          <p className="max-w-lg text-sm text-on-surface-variant">
            Scrub the month. Watch the balance curve and category mix move with
            you as we reconstruct your financial history step by step.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-container-high px-4 py-2">
            <span className="font-label text-on-surface-variant">Period</span>
            <span className="font-data text-sm text-on-surface">{periodLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (safeIndex >= points.length - 1) setIndex(0);
              setPlaying((p) => !p);
            }}
            className="flex items-center gap-2 rounded-full bg-primary-fixed px-6 py-2 font-label text-on-primary-container transition hover:opacity-90"
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {playing ? "pause" : "play_arrow"}
            </span>
            {playing ? "Pause" : "Auto Play"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-4 rounded-xl border border-white/5 bg-surface-container-high p-6 md:col-span-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label">Balance at {current?.date}</span>
            <span className="material-symbols-outlined text-sm">history</span>
          </div>
          <div className="font-display text-[32px] font-bold tracking-tight text-white">
            {formatINR(current?.balanceCents ?? 0)}
          </div>
          <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-4">
            <div className="font-data flex justify-between text-xs">
              <span className="text-on-surface-variant">Day net</span>
              <span className="text-on-surface">
                {formatINR(current?.netCents ?? 0)}
              </span>
            </div>
            <div className="font-data flex justify-between text-xs">
              <span className="text-on-surface-variant">Income</span>
              <span className="text-primary">{formatINR(current?.incomeCents ?? 0)}</span>
            </div>
            <div className="font-data flex justify-between text-xs">
              <span className="text-on-surface-variant">Expense</span>
              <span className="text-secondary-container">
                {formatINR(current?.expenseCents ?? 0)}
              </span>
            </div>
          </div>

          {categoryEntries.length > 0 && (
            <div className="space-y-2 border-t border-outline-variant/20 pt-4">
              {categoryEntries.slice(0, 4).map(([name, data]) => (
                <div
                  key={name}
                  className="font-data flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: data.color }}
                    />
                    {name}
                  </span>
                  <span className="text-on-surface">{formatINR(data.cents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-surface-container-high p-6 md:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-display text-lg font-semibold">
                Trajectory Analysis
              </h3>
              <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container px-3 py-1">
                <div className="neon-glow h-2 w-2 rounded-full bg-neon-cyan" />
                <span className="font-label text-[10px] text-on-surface-variant">
                  Running balance
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={jumpToSpike}
              disabled={!spikeDay}
              className="rounded-lg border border-outline-variant/30 bg-surface-variant px-4 py-1.5 font-label text-xs text-on-surface transition hover:bg-surface-container-highest disabled:opacity-40"
            >
              Jump to spike
            </button>
          </div>

          <div className="relative mt-2 h-[280px] w-full">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-10">
              <div className="w-full border-t border-on-surface" />
              <div className="w-full border-t border-on-surface" />
              <div className="w-full border-t border-on-surface" />
              <div className="w-full border-t border-on-surface" />
            </div>

            <svg
              className="relative z-10 h-[200px] w-full"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              role="img"
              aria-label="Cashflow balance over time"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00f5ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line
                x1={0}
                x2={width}
                y1={
                  height -
                  ((0 - minY) / (maxY - minY || 1)) * (height - 24) -
                  12
                }
                y2={
                  height -
                  ((0 - minY) / (maxY - minY || 1)) * (height - 24) -
                  12
                }
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
              />
              <path d={areaPath} fill="url(#chartGradient)" />
              <path
                className="neon-glow"
                d={path}
                fill="none"
                stroke="#00f5ff"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <line
                x1={cursorX}
                x2={cursorX}
                y1={0}
                y2={height}
                stroke="rgba(174, 247, 89, 0.7)"
                strokeWidth="2"
              />
              {current && (
                <circle
                  cx={cursorX}
                  cy={
                    height -
                    ((current.balanceCents - minY) / (maxY - minY || 1)) *
                      (height - 24) -
                    12
                  }
                  r="5"
                  fill="#aef759"
                />
              )}
            </svg>

            <div className="absolute bottom-0 left-0 w-full pt-2">
              <input
                type="range"
                min={0}
                max={Math.max(points.length - 1, 0)}
                value={safeIndex}
                onChange={(e) => {
                  setPlaying(false);
                  setIndex(Number(e.target.value));
                }}
                className="w-full cursor-pointer"
                aria-label="Scrub cashflow timeline"
              />
              <div className="font-data mt-3 flex justify-between text-[10px] uppercase tracking-widest text-on-surface-variant/50">
                <span>{points[0]?.date.slice(5)}</span>
                <span>{points[Math.floor(points.length / 2)]?.date.slice(5)}</span>
                <span>{points[points.length - 1]?.date.slice(5)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
