"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "ok" | "err" | "info" };

let pushToast: ((message: string, tone?: Toast["tone"]) => void) | null = null;

export function toast(message: string, tone: Toast["tone"] = "info") {
  pushToast?.(message, tone);
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    pushToast = (message, tone = "info") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[70] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
            t.tone === "ok"
              ? "border-primary/30 bg-surface-container text-primary-fixed"
              : t.tone === "err"
                ? "border-error/30 bg-surface-container text-error"
                : "border-white/10 bg-surface-container text-on-surface"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
