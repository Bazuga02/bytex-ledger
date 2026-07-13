"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CashflowReplay } from "@/components/CashflowReplay";
import { GmailSettings } from "@/components/GmailSettings";
import { NotificationPanel } from "@/components/NotificationPanel";
import { PinGate } from "@/components/PinGate";
import { SideNav, type NavId } from "@/components/SideNav";
import { SummaryStrip } from "@/components/SummaryStrip";
import { ToastHost, toast } from "@/components/ToastHost";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import type {
  Category,
  LedgerTransaction,
  NotificationRow,
  ReplayPoint,
  Summary,
} from "@/lib/types";

export function LedgerApp() {
  const [pinRequired, setPinRequired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeNav, setActiveNav] = useState<NavId>("home");
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [replayPoints, setReplayPoints] = useState<ReplayPoint[]>([]);
  const [spikeDay, setSpikeDay] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const homeRef = useRef<HTMLElement>(null);
  const analyticsRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth");
    const data = await res.json();
    setPinRequired(Boolean(data.required));
    setUnlocked(!data.required || Boolean(data.unlocked));
    setAuthChecked(true);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, txs, sum, replay, notes] = await Promise.all([
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/transactions").then((r) => r.json()),
        fetch("/api/summary").then((r) => r.json()),
        fetch("/api/replay").then((r) => r.json()),
        fetch("/api/notifications").then((r) => r.json()),
      ]);

      if (cats.error || txs.error) {
        if (cats.code === "PIN_REQUIRED" || txs.error === "PIN required") {
          setUnlocked(false);
          return;
        }
        toast(cats.error || txs.error || "Failed to load", "err");
      }

      setCategories(cats.categories ?? []);
      setTransactions(txs.transactions ?? []);
      setSummary(sum.summary ?? null);
      setReplayPoints(replay.points ?? []);
      setSpikeDay(replay.spikeDay ?? null);
      setNotifications(notes.notifications ?? []);
    } catch {
      toast("Failed to load ledger data", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && unlocked) {
      loadAll();
    }
  }, [authChecked, unlocked, loadAll]);

  function navigate(id: NavId) {
    setActiveNav(id);
    const map = {
      home: homeRef,
      analytics: analyticsRef,
      notifications: notificationsRef,
      settings: settingsRef,
    } as const;
    map[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredTransactions = search.trim()
    ? transactions.filter((tx) => {
        const q = search.toLowerCase();
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.categoryName.toLowerCase().includes(q) ||
          tx.type.toLowerCase().includes(q)
        );
      })
    : transactions;

  return (
    <>
      <ToastHost />
      {authChecked && pinRequired && (
        <PinGate unlocked={unlocked} onUnlock={() => setUnlocked(true)} />
      )}

      <div className="flex min-h-screen overflow-hidden bg-background">
        <SideNav
          active={activeNav}
          onNavigate={navigate}
          onNewEntry={() => {
            setActiveNav("home");
            formRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <main className="scrollbar-hide relative h-screen flex-1 overflow-y-auto grid-bg">
          <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 items-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container px-4">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="font-data w-40 border-none bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:shadow-none sm:w-64"
                  placeholder="Search entries..."
                  type="text"
                />
              </div>
              <div className="hidden gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => navigate("home")}
                  className={`px-4 py-2 font-label ${
                    activeNav === "home"
                      ? "border-b-2 border-primary-fixed text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Monitoring
                </button>
                <button
                  type="button"
                  onClick={() => navigate("analytics")}
                  className={`px-4 py-2 font-label ${
                    activeNav === "analytics"
                      ? "border-b-2 border-primary-fixed text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Analytics
                </button>
                <button
                  type="button"
                  onClick={() => navigate("notifications")}
                  className={`px-4 py-2 font-label ${
                    activeNav === "notifications"
                      ? "border-b-2 border-primary-fixed text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Alerts
                </button>
                <button
                  type="button"
                  onClick={() => navigate("settings")}
                  className={`px-4 py-2 font-label ${
                    activeNav === "settings"
                      ? "border-b-2 border-primary-fixed text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("notifications")}
                className="relative rounded-full p-2 transition hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  notifications
                </span>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border border-background bg-secondary-container" />
                )}
              </button>
              <div className="hidden items-center gap-3 border-l border-outline-variant/30 pl-4 sm:flex">
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-on-surface">
                    Operator
                  </p>
                  <p className="font-data text-xs text-on-surface-variant">
                    @bytex
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-fixed/50 bg-surface-variant">
                  <span className="material-symbols-outlined text-primary">
                    person
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-8">
            <section ref={homeRef} id="home" className="fade-up scroll-mt-24">
              <h2 className="font-display mb-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Bytex Ledger
              </h2>
              <p className="mb-10 max-w-2xl text-base text-on-surface-variant">
                A smart mini-ledger with Contradiction Guard and Cashflow Replay
                — track income and expenses without the spreadsheet fog.
              </p>

              <SummaryStrip summary={summary} loading={loading && unlocked} />

              <div ref={formRef} className="mb-10">
                <TransactionForm
                  categories={categories}
                  summary={summary}
                  onCreated={loadAll}
                />
              </div>

              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <h3 className="font-display text-2xl text-white">Ledger</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Journal of income and expenses — flagged rows need a category check.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-outline-variant/40 bg-surface-container-high px-3 py-1.5 font-data text-xs text-on-surface-variant">
                    {filteredTransactions.length} shown
                  </span>
                </div>
              </div>
              <TransactionList
                transactions={filteredTransactions}
                categories={categories}
                loading={loading && unlocked}
                onChanged={loadAll}
              />
            </section>

            <section
              ref={analyticsRef}
              id="analytics"
              className="fade-up scroll-mt-24 border-t border-outline-variant/20 pt-10"
            >
              <CashflowReplay
                points={replayPoints}
                spikeDay={spikeDay}
                loading={loading && unlocked}
              />
            </section>

            <section
              ref={notificationsRef}
              id="notifications"
              className="fade-up scroll-mt-24 border-t border-outline-variant/20 pt-10"
            >
              <NotificationPanel
                notifications={notifications}
                onChanged={loadAll}
              />
            </section>

            <section
              ref={settingsRef}
              id="settings"
              className="fade-up scroll-mt-24 border-t border-outline-variant/20 pt-10 pb-16"
            >
              <h2 className="font-display mb-2 text-[32px] font-semibold text-white">
                Settings
              </h2>
              <p className="mb-6 max-w-2xl text-sm text-on-surface-variant">
                Configure how Bytex Ledger sends alerts. Gmail settings are stored
                in the database; env vars remain a fallback if nothing is saved here.
              </p>
              <GmailSettings />
            </section>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate("home");
              formRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-2xl transition hover:scale-105 active:scale-95 lg:hidden"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </main>
      </div>
    </>
  );
}
