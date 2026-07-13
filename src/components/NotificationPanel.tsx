"use client";

import type { NotificationRow } from "@/lib/types";
import { toast } from "./ToastHost";

function iconFor(eventType: string) {
  switch (eventType) {
    case "suggestion_accepted":
      return {
        icon: "check_box",
        color: "text-primary-fixed",
        border: "border-primary-fixed/40",
      };
    case "contradiction_flagged":
      return {
        icon: "error",
        color: "text-secondary-container",
        border: "border-secondary-container/40",
      };
    case "large_expense":
      return {
        icon: "warning",
        color: "text-secondary",
        border: "border-secondary/40",
      };
    case "test":
      return {
        icon: "notifications_active",
        color: "text-on-surface-variant",
        border: "border-outline/20",
      };
    default:
      return {
        icon: "mail",
        color: "text-on-surface-variant",
        border: "border-outline/20",
      };
  }
}

/** Strip emoji prefixes from older logged messages (icons already show status). */
function cleanMessage(raw: unknown, fallback: string): string {
  return String(raw ?? fallback)
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\s]+/u, "")
    .trim();
}

export function NotificationPanel({
  notifications,
  onChanged,
}: {
  notifications: NotificationRow[];
  onChanged: () => void;
}) {
  async function sendTest() {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello from Bytex Ledger" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "Notify failed", "err");
      return;
    }
    toast(
      data.channel === "gmail"
        ? data.status === "sent"
          ? "Sent via Gmail"
          : "Gmail failed — logged in-app"
        : "Logged in-app (Gmail not configured)",
      data.status === "failed" ? "err" : "ok",
    );
    onChanged();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[32px] font-semibold text-white">
            Contradiction Guard
          </h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Gmail when configured; always logged in-app.
          </p>
        </div>
        <button
          type="button"
          onClick={sendTest}
          className="rounded-lg border border-outline-variant px-5 py-2 font-label text-[11px] transition hover:bg-white/5"
        >
          Send test
        </button>
      </div>

      <p className="font-label text-[10px] tracking-[0.2em] text-on-surface-variant">
        Notification log
      </p>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-container-low p-5 text-sm text-on-surface-variant">
          No notifications yet. Large expenses and contradiction flags appear
          here (and via Gmail if configured).
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const meta = iconFor(n.eventType);
            return (
              <div
                key={n.id}
                className={`group flex flex-col gap-1 border-l-2 py-4 pl-6 transition-all hover:bg-white/5 ${meta.border}`}
              >
                <div className="font-data flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                  <span>{n.eventType}</span>
                  <span className="h-1 w-1 rounded-full bg-outline-variant" />
                  <span>{n.channel}</span>
                  <span className="h-1 w-1 rounded-full bg-outline-variant" />
                  <span>{n.status}</span>
                  <span className="h-1 w-1 rounded-full bg-outline-variant" />
                  <time>
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${meta.color}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {meta.icon}
                  </span>
                  <p className="text-base text-on-surface">
                    {cleanMessage(n.payload?.message, n.eventType)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
