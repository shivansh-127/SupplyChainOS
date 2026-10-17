
function StatCard({ label, value, detail, accent = "cyan" }) {
    const accents = {
        cyan: "text-cyan-300",
        red: "text-red-400",
        amber: "text-amber-300",
        emerald: "text-emerald-300",
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">{label}</p>

            <p className={`mt-3 text-3xl font-bold ${accents[accent]}`}>
                {value}
            </p>

            <p className="mt-2 text-xs text-slate-500">{detail}</p>
        </div>
    );
}

export default StatCard;
