"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Category, Summary } from "@/lib/types";
import { formatINR } from "@/lib/money";
import { CategorySelect } from "./CategorySelect";
import { DateTimePicker } from "./DateTimePicker";
import { toast } from "./ToastHost";

export function TransactionForm({
  categories,
  summary,
  onCreated,
}: {
  categories: Category[];
  summary: Summary | null;
  onCreated: () => void;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    () => new Date().toISOString().slice(0, 16),
  );
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const activeCategoryId = filtered.some((c) => c.id === categoryId)
    ? categoryId
    : (filtered[0]?.id ?? "");

  const expenseCats = (summary?.byCategory ?? [])
    .filter((c) => c.type === "expense")
    .slice(0, 4);
  const maxExpense = Math.max(...expenseCats.map((c) => c.totalCents), 1);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast("Enter a valid amount", "err");
      return;
    }
    if (!activeCategoryId) {
      toast("Pick a category", "err");
      return;
    }

    setBusy(true);
    try {
      const occurred = new Date(occurredAt);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          type,
          categoryId: activeCategoryId,
          description,
          occurredAt: occurred.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not save", "err");
        return;
      }
      toast("Transaction added", "ok");
      setAmount("");
      setDescription("");
      onCreated();
    } catch {
      toast("Network error", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="glass-card rounded-2xl p-6 lg:col-span-8 lg:p-8 relative z-20">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              New entry
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Try describing “Uber to airport” under Food — Contradiction Guard
              will catch it.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
            <div className="flex flex-col gap-2 lg:col-span-3">
              <label className="font-label text-on-surface-variant">Type</label>
              <div className="flex rounded-xl border border-outline-variant bg-surface-container-lowest p-1">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg py-2 font-label transition-all ${
                      type === t
                        ? t === "expense"
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-primary-container text-on-primary-container"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:col-span-2">
              <label className="font-label text-on-surface-variant">
                Amount (₹)
              </label>
              <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3 transition-colors focus-within:border-primary-fixed">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-data w-full border-none bg-transparent p-0 text-lg text-white outline-none focus:shadow-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:col-span-3">
              <label className="font-label text-on-surface-variant">
                Category
              </label>
              <CategorySelect
                categories={filtered}
                value={activeCategoryId}
                onChange={setCategoryId}
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-4">
              <label className="font-label text-on-surface-variant">When</label>
              <DateTimePicker value={occurredAt} onChange={setOccurredAt} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label text-on-surface-variant">
              Description
            </label>
            <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4 transition-colors focus-within:border-primary-fixed">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-none bg-transparent p-0 text-base text-white outline-none focus:shadow-none"
                placeholder="e.g. Uber to airport"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="neo-glow-primary flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-display text-[16px] font-extrabold text-on-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Add transaction"}
              <span className="material-symbols-outlined">
                {busy ? "refresh" : "add"}
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card flex flex-col rounded-2xl p-6 lg:col-span-4 lg:p-8">
        <div className="mb-6 flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            Cashflow Status
          </h3>
          <span className="rounded bg-primary-container px-2 py-1 text-[10px] font-bold text-on-primary-container">
            LIVE
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          {expenseCats.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Expense mix appears here once you add entries.
            </p>
          ) : (
            expenseCats.map((c, i) => (
              <div key={c.name} className="space-y-1">
                <div className="font-data mb-1 flex justify-between text-xs">
                  <span className="text-on-surface-variant uppercase">
                    {c.name}
                  </span>
                  <span className="text-white">{formatINR(c.totalCents)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={`h-full rounded-full ${i % 2 === 0 ? "bg-secondary" : "bg-primary"}`}
                    style={{
                      width: `${Math.max(8, (c.totalCents / maxExpense) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}

          <div className="mt-auto border-t border-outline-variant pt-6">
            <p className="text-sm leading-relaxed text-on-surface-variant italic">
              {summary && summary.expenseCents > summary.incomeCents
                ? `"Spending outpaces income by ${formatINR(summary.expenseCents - summary.incomeCents)}. Contradiction Guard is watching miscategorized rows."`
                : `"Ledger is balanced enough to breathe — keep scrubbing Cashflow Replay for spikes."`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
