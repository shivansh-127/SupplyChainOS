const navItems = [
    { icon: "▦", label: "Control Tower" },
    { icon: "◉", label: "Disruption Workspace" },
    { icon: "⇄", label: "Suppliers" },
    { icon: "▤", label: "Inventory" },
    { icon: "↗", label: "Shipments" },
    { icon: "✦", label: "AI Copilot" },
    { icon: "▣", label: "Knowledge Center" },
];

function Sidebar({ activeSection, onNavigate }) {
    return (
        <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
                    S
                </div>

                <div>
                    <h1 className="text-lg font-bold text-white">
                        SupplyChainOS
                    </h1>
                    <p className="text-xs text-slate-400">
                        Decision Intelligence
                    </p>
                </div>
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Workspace
            </p>

            <nav className="flex flex-wrap gap-2 md:flex-col">
                {navItems.map((item) => {
                    const active = activeSection === item.label;

                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => onNavigate(item.label)}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                                active
                                    ? "bg-cyan-400/10 font-semibold text-cyan-300"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4 md:mt-auto">
                <p className="text-sm font-semibold text-white">
                    System Status
                </p>

                <div className="mt-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-400">
                        Connected to API
                    </span>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
