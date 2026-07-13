"use client";

import { formatINR } from "@/lib/money";
import type { Summary } from "@/lib/types";

export function SummaryStrip({
  summary,
  loading,
}: {
  summary: Summary | null;
  loading: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card h-36 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const critical = summary.balanceCents < 0;
  const cards = [
    {
      label: "Balance",
      value: formatINR(summary.balanceCents),
      icon: "account_balance_wallet",
      valueClass: critical ? "text-secondary" : "text-primary",
      iconClass: critical ? "text-error" : "text-primary",
      hint: critical ? "Critical Level" : "Healthy",
      hintDot: critical ? "bg-secondary-container" : "bg-primary",
    },
    {
      label: "Income",
      value: formatINR(summary.incomeCents),
      icon: "trending_up",
      valueClass: "text-primary",
      iconClass: "text-primary",
      hint:
        summary.incomeCents === 0 ? "No income logged" : "Total credited",
      hintDot: "bg-primary-fixed",
    },
    {
      label: "Expenses",
      value: formatINR(summary.expenseCents),
      icon: "shopping_cart",
      valueClass: "text-secondary",
      iconClass: "text-secondary",
      hint: "Total spent",
      hintDot: "bg-secondary",
    },
    {
      label: "Entries",
      value: String(summary.transactionCount),
      icon: "list_alt",
      valueClass: "text-white",
      iconClass: "text-on-surface-variant",
      hint: "Ledger rows",
      hintDot: "bg-on-surface-variant",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card group flex flex-col justify-between rounded-2xl p-6 transition-colors hover:bg-surface-variant"
        >
          <div className="mb-4 flex items-start justify-between">
            <span className="font-label text-on-surface-variant">
              {card.label}
            </span>
            <span
              className={`material-symbols-outlined transition-transform group-hover:scale-110 ${card.iconClass}`}
            >
              {card.icon}
            </span>
          </div>
          <div>
            <h3
              className={`font-display text-[28px] font-semibold leading-tight ${card.valueClass}`}
            >
              {card.value}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${card.hintDot}`} />
              <p className="text-sm text-on-surface-variant">{card.hint}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
