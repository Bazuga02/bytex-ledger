"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "./ToastHost";

type GmailStatus = {
  configured: boolean;
  source: "ui" | "env" | "none";
  user: string;
  notifyTo: string;
  hasPassword: boolean;
  envFallback: boolean;
};

export function GmailSettings() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [user, setUser] = useState("");
  const [notifyTo, setNotifyTo] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/gmail");
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not load Gmail settings", "err");
        return;
      }
      const g = data.gmail as GmailStatus;
      setStatus(g);
      setUser(g.user || "");
      setNotifyTo(g.notifyTo || "");
      setAppPassword("");
    } catch {
      toast("Could not load Gmail settings", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/gmail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          notifyTo,
          appPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Save failed", "err");
        return;
      }
      setStatus(data.gmail);
      setAppPassword("");
      toast("Gmail settings saved", "ok");
    } catch {
      toast("Save failed", "err");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/gmail", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Disconnect failed", "err");
        return;
      }
      setStatus(data.gmail);
      setUser("");
      setNotifyTo("");
      setAppPassword("");
      toast("Gmail disconnected — alerts stay in-app", "ok");
    } catch {
      toast("Disconnect failed", "err");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card h-48 animate-pulse rounded-2xl" />
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-variant">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mail
              </span>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-white">
                Gmail notifications
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Connect a Gmail account with an{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-fixed underline-offset-2 hover:underline"
                >
                  App Password
                </a>{" "}
                so ledger alerts can email you.
              </p>
            </div>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-label text-[10px] ${
            status?.configured
              ? "bg-primary-container/15 text-primary-container"
              : "bg-surface-variant text-on-surface-variant"
          }`}
        >
          {status?.configured
            ? status.envFallback
              ? "Connected via env"
              : "Connected"
            : "Not connected"}
        </span>
      </div>

      {status?.envFallback && (
        <div className="mb-5 rounded-xl border border-primary-fixed/20 bg-primary-fixed/5 px-4 py-3 text-sm text-on-surface-variant">
          Using server env vars right now. Saving this form stores UI settings in
          the database and takes priority over env.
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="font-label text-on-surface-variant">
              Gmail address (sender)
            </label>
            <div className="rounded-xl border border-outline-variant bg-surface-container-high px-3 py-3 transition-colors focus-within:border-primary-fixed">
              <input
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full border-none bg-transparent p-0 text-sm text-white outline-none focus:shadow-none"
                placeholder="you@gmail.com"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label text-on-surface-variant">
              Notify to (recipient)
            </label>
            <div className="rounded-xl border border-outline-variant bg-surface-container-high px-3 py-3 transition-colors focus-within:border-primary-fixed">
              <input
                type="email"
                value={notifyTo}
                onChange={(e) => setNotifyTo(e.target.value)}
                className="w-full border-none bg-transparent p-0 text-sm text-white outline-none focus:shadow-none"
                placeholder="alerts@gmail.com"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label text-on-surface-variant">
            App password
            {status?.hasPassword ? " (leave blank to keep current)" : ""}
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-3 py-3 transition-colors focus-within:border-primary-fixed">
            <input
              type={showPassword ? "text" : "password"}
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent p-0 font-data text-sm text-white outline-none focus:shadow-none"
              placeholder={
                status?.hasPassword ? "•••• •••• •••• ••••" : "16-character app password"
              }
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "visibility_off" : "visibility"}
            </button>
          </div>
          <p className="text-xs text-on-surface-variant">
            Google Account → Security → 2-Step Verification → App passwords. Do
            not use your normal Gmail password.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={disconnect}
            disabled={saving || (!status?.configured && !user && !notifyTo)}
            className="rounded-lg border border-error/30 px-4 py-2 font-label text-[11px] text-error transition hover:bg-error/10 disabled:opacity-40"
          >
            Disconnect
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary-fixed px-6 py-2.5 font-label text-[11px] text-on-primary-container transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Gmail settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
