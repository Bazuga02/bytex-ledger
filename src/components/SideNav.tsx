"use client";

type NavId = "home" | "analytics" | "notifications" | "settings";

const NAV: { id: NavId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "analytics", label: "Analytics", icon: "query_stats" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function SideNav({
  active,
  onNavigate,
  onNewEntry,
}: {
  active: NavId;
  onNavigate: (id: NavId) => void;
  onNewEntry: () => void;
}) {
  return (
    <aside className="glass-sidebar sticky top-0 z-50 hidden h-screen w-[280px] shrink-0 flex-col gap-8 border-r border-outline-variant px-4 py-8 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <span
            className="material-symbols-outlined font-bold text-on-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            query_stats
          </span>
        </div>
        <div>
          <h1 className="font-display text-[20px] font-bold leading-tight text-primary">
            Bytex Ledger
          </h1>
          <p className="font-label text-[10px] text-on-surface-variant">
            Command Center
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                isActive
                  ? "bg-surface-variant text-primary-fixed shadow-[0_0_15px_rgba(147,218,63,0.12)]"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onNewEntry}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-label text-on-primary-container transition hover:opacity-90 active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Entry
      </button>

      <div className="flex flex-col gap-2 border-t border-outline-variant/40 pt-4">
        <div className="flex items-center gap-4 rounded-xl px-4 py-3 text-on-surface-variant">
          <span className="material-symbols-outlined">help</span>
          <span className="text-sm">Support</span>
        </div>
      </div>
    </aside>
  );
}

export type { NavId };
