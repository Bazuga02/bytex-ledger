"use client";

import { formatINR } from "@/lib/money";
import type { Category, LedgerTransaction } from "@/lib/types";
import { toast } from "./ToastHost";

const CATEGORY_ICONS: Record<string, string> = {
  Food: "restaurant",
  Transport: "commute",
  Rent: "home",
  Utilities: "bolt",
  Shopping: "shopping_cart",
  Entertainment: "movie",
  Health: "medical_services",
  Salary: "payments",
  Freelance: "work",
  Investments: "trending_up",
  "Other Income": "payments",
  "Other Expense": "receipt_long",
};

export function TransactionList({
  transactions,
  categories,
  loading,
  onChanged,
}: {
  transactions: LedgerTransaction[];
  categories: Category[];
  loading: boolean;
  onChanged: () => void;
}) {
  async function softDelete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "Delete failed", "err");
      return;
    }
    toast("Transaction removed", "ok");
    onChanged();
  }

  async function acceptSuggestion(id: string) {
    const res = await fetch(`/api/transactions/${id}/accept-suggestion`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "Could not apply suggestion", "err");
      return;
    }
    toast("Category corrected", "ok");
    onChanged();
  }

  if (loading) {
    return (
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="space-y-0 divide-y divide-outline-variant/20">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-5">
              <div className="h-11 w-11 animate-pulse rounded-full bg-surface-variant" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-surface-variant" />
                <div className="h-3 w-56 animate-pulse rounded bg-surface-variant/70" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded bg-surface-variant" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass-card rounded-2xl px-6 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-variant">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">
            receipt_long
          </span>
        </div>
        <p className="font-display text-xl text-white">No entries yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-on-surface-variant">
          Add an income or expense above to start building your ledger history.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex max-h-[520px] flex-col overflow-hidden rounded-2xl">
      <div className="hidden shrink-0 grid-cols-12 gap-4 border-b border-outline-variant/30 bg-surface-container/40 px-5 py-3 md:grid">
        <div className="col-span-4 font-label text-[11px] text-on-surface-variant">
          Transaction
        </div>
        <div className="col-span-3 font-label text-[11px] text-on-surface-variant">
          Category
        </div>
        <div className="col-span-2 font-label text-[11px] text-on-surface-variant">
          Type
        </div>
        <div className="col-span-3 text-right font-label text-[11px] text-on-surface-variant">
          Amount
        </div>
      </div>

      <ul className="ledger-scroll divide-y divide-outline-variant/20 overflow-y-auto">
        {transactions.map((tx) => {
          const suggested = categories.find(
            (c) => c.id === tx.suggestedCategoryId,
          );
          const flagged = Boolean(
            tx.suggestedCategoryId && tx.contradictionScore,
          );
          const icon = CATEGORY_ICONS[tx.categoryName] ?? "receipt_long";
          const isIncome = tx.type === "income";

          return (
            <li key={tx.id}>
              <div
                className={`group relative px-4 py-4 transition-colors hover:bg-white/[0.03] sm:px-5 ${
                  flagged
                    ? "bg-secondary-container/[0.04]"
                    : ""
                }`}
              >
                <div
                  className={`absolute top-4 bottom-4 left-0 w-1 rounded-r-full ${
                    flagged
                      ? "bg-secondary"
                      : isIncome
                        ? "bg-primary-fixed shadow-[0_0_8px_rgba(147,218,63,0.45)]"
                        : "bg-secondary-container"
                  }`}
                />

                <div className="grid grid-cols-1 items-center gap-3 pl-3 md:grid-cols-12 md:gap-4">
                  <div className="flex min-w-0 items-center gap-3 md:col-span-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                        isIncome
                          ? "bg-primary-container/15 text-primary-container"
                          : "bg-surface-variant text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-on-surface">
                        {tx.description || tx.categoryName}
                      </p>
                      <p className="font-data mt-0.5 text-[12px] text-on-surface-variant">
                        {new Date(tx.occurredAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:col-span-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-variant px-3 py-1 font-label text-[10px] text-on-surface"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tx.categoryColor }}
                      />
                      {tx.categoryName}
                    </span>
                    {flagged && (
                      <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 font-label text-[9px] text-secondary">
                        Flagged
                      </span>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 font-label text-[10px] ${
                        isIncome
                          ? "bg-primary-container/15 text-primary-container"
                          : "bg-secondary-container/20 text-secondary"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
                    <span
                      className={`font-data text-lg font-bold tabular-nums ${
                        isIncome ? "text-primary-container" : "text-secondary"
                      }`}
                    >
                      {isIncome ? "+" : "−"}
                      {formatINR(tx.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => softDelete(tx.id)}
                      className="rounded-lg border border-error/30 px-3 py-1.5 font-label text-[10px] text-error opacity-100 transition-all hover:bg-error/10 md:opacity-0 md:group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {flagged && (
                  <div className="mt-3 ml-3 flex flex-col gap-3 rounded-xl border border-secondary/25 bg-secondary-container/10 p-3 sm:ml-14 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-secondary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        error
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-on-surface">
                          {tx.contradictionReason}
                        </p>
                        <p className="font-data mt-1 text-[11px] text-on-surface-variant">
                          Confidence {tx.contradictionScore}%
                          {suggested ? ` · suggested ${suggested.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => acceptSuggestion(tx.id)}
                      className="shrink-0 rounded-full bg-primary-fixed px-4 py-2 font-label text-[10px] text-on-primary-container transition hover:opacity-90"
                    >
                      Accept suggestion
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
