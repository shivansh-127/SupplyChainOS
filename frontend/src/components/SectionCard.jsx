
function SectionCard({ title, subtitle, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="font-semibold text-white">{title}</h2>

                {subtitle && (
                    <p className="mt-1 text-sm text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

export default SectionCard;
