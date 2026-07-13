"use client";

import { FormEvent, useState } from "react";
import { toast } from "./ToastHost";

export function PinGate({
  unlocked,
  onUnlock,
}: {
  unlocked: boolean;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  if (unlocked) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Incorrect PIN", "err");
        return;
      }
      toast("Ledger unlocked", "ok");
      onUnlock();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <form
        onSubmit={submit}
        className="glass-card w-full max-w-sm rounded-2xl p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="material-symbols-outlined text-on-primary">
              lock
            </span>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-white">
              Bytex Ledger
            </p>
            <p className="font-label text-[10px] text-on-surface-variant">
              Command Center
            </p>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant">
          Enter the ledger PIN to continue.
        </p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-6 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
          placeholder="PIN"
          autoFocus
        />
        <button
          type="submit"
          disabled={busy || !pin}
          className="mt-4 w-full rounded-full bg-primary py-3 font-display font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
