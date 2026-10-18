const navItems = [
    { icon: "▦", label: "Control Tower", description: "Overview" },
    { icon: "◉", label: "Disruption Workspace", description: "Impact & recovery" },
    { icon: "⇄", label: "Suppliers", description: "Supplier options" },
    { icon: "▤", label: "Inventory", description: "Stock coverage" },
    { icon: "↗", label: "Shipments", description: "Inbound logistics" },
    { icon: "✦", label: "AI Copilot", description: "Decision support" },
    { icon: "▣", label: "Knowledge Center", description: "Policies & evidence" },
];

function Sidebar({ activeSection, onNavigate }) {
    return (
        <aside className="z-20 flex w-full shrink-0 flex-col border-b border-white/10 bg-[#050506] px-4 py-5 md:sticky md:top-0 md:h-screen md:w-[270px] md:overflow-y-auto md:overscroll-contain md:border-b-0 md:border-r md:border-white/[0.08] md:px-5 md:py-7">
            <div className="mb-8 flex items-center gap-3 px-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-lg shadow-red-950/40">
                    S
                </div>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-bold tracking-tight text-white">
                        SupplyChainOS
                    </h1>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Decision intelligence
                    </p>
                </div>
            </div>

            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                Workspace
            </div>

            <nav
                className="flex flex-wrap gap-1.5 md:flex-col"
                aria-label="Main navigation"
            >
                {navItems.map((item) => {
                    const active = activeSection === item.label;

                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => onNavigate(item.label)}
                            aria-current={active ? "page" : undefined}
                            className={`group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 md:w-full ${
                                active
                                    ? "border-red-500/30 bg-red-500/10 text-white shadow-sm shadow-red-950/20"
                                    : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                            }`}
                        >
                            <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition ${
                                    active
                                        ? "bg-red-600 text-white"
                                        : "bg-white/[0.04] text-zinc-400 group-hover:bg-white/[0.08] group-hover:text-white"
                                }`}
                                aria-hidden="true"
                            >
                                {item.icon}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold sm:text-sm">
                                    {item.label}
                                </span>
                                <span
                                    className={`mt-1 hidden text-[11px] md:block ${
                                        active
                                            ? "text-red-200/70"
                                            : "text-zinc-600 group-hover:text-zinc-400"
                                    }`}
                                >
                                    {item.description}
                                </span>
                            </span>

                            {active && (
                                <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 md:block" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:mt-auto md:min-h-fit">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white">
                        System status
                    </p>
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                    Local API indicator only. It does not verify supplier or live shipment availability.
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    <span>Environment</span>
                    <span className="text-red-400">Demo</span>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
