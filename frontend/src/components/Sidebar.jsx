
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  BrainCircuit,
  ChevronRight,
  ClipboardList,
  Factory,
  LayoutDashboard,
  LibraryBig,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

const navigationGroups = [
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Control Tower",
        description: "Operational overview",
        icon: LayoutDashboard,
      },
      {
        label: "Disruption Workspace",
        description: "Impact and recovery",
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: "SUPPLY NETWORK",
    items: [
      {
        label: "Suppliers",
        description: "Supplier alternatives",
        icon: Factory,
      },
      {
        label: "Inventory",
        description: "Stock and coverage",
        icon: Boxes,
      },
      {
        label: "Shipments",
        description: "Inbound logistics",
        icon: Truck,
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        label: "AI Copilot",
        description: "Ask and investigate",
        icon: BrainCircuit,
      },
      {
        label: "Knowledge Center",
        description: "Documents and evidence",
        icon: LibraryBig,
      },
    ],
  },
];

export default function Sidebar({ activeSection, onNavigate }) {
  return (
    <aside className="z-30 flex w-full flex-shrink-0 flex-col border-b border-slate-800 bg-[#0b1220] md:sticky md:top-0 md:h-screen md:w-[260px] md:border-b-0 md:border-r">
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 md:px-6 md:py-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/10">
            <Activity size={22} strokeWidth={2.5} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-white">
              SupplyChain<span className="text-sky-400">OS</span>
            </h1>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Decision intelligence
            </p>
          </div>
        </div>

        <span className="hidden rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-400 md:inline-flex">
          BETA
        </span>
      </div>

      {/* Workspace label */}
      <div className="hidden px-6 pb-3 md:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Main menu
        </p>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex gap-2 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-6 md:overflow-x-hidden md:overflow-y-auto md:px-4 md:pb-5"
      >
        {navigationGroups.map((group) => (
          <div key={group.title} className="flex-shrink-0 md:w-full">
            <p className="mb-2 hidden px-3 text-[10px] font-semibold tracking-[0.16em] text-slate-600 md:block">
              {group.title}
            </p>

            <div className="flex gap-2 md:flex-col md:gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.label;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.label)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "group flex min-h-10 flex-shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                      "md:w-full",
                      active
                        ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
                        : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-sky-400/15 text-sky-300"
                          : "bg-slate-900 text-slate-500 group-hover:text-slate-200",
                      ].join(" ")}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block whitespace-nowrap text-xs font-medium md:text-sm">
                        {item.label}
                      </span>
                      <span className="mt-0.5 hidden text-[11px] text-slate-500 md:block">
                        {item.description}
                      </span>
                    </span>

                    <ChevronRight
                      size={15}
                      className={[
                        "hidden flex-shrink-0 md:block",
                        active
                          ? "text-sky-300"
                          : "text-slate-700 opacity-0 transition group-hover:opacity-100",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="hidden p-4 md:block">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-xs font-medium text-slate-200">
              Operations workspace
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Review live records and verify recovery actions before making
            operational commitments.
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
            <ShieldCheck size={13} />
            <span>Decision support system</span>
            <ArrowUpRight size={12} className="ml-auto" />
          </div>
        </div>
      </div>
    </aside>
  );
}
