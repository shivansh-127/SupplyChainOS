
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const tones = {
  red: {
    icon: "bg-red-500/10 text-red-400",
    accent: "bg-red-400",
    border: "border-red-500/20",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400",
    accent: "bg-amber-400",
    border: "border-amber-500/20",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-400",
    accent: "bg-emerald-400",
    border: "border-emerald-500/20",
  },
  blue: {
    icon: "bg-sky-500/10 text-sky-400",
    accent: "bg-sky-400",
    border: "border-sky-500/20",
  },
};

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
  trend,
  trendDirection = "neutral",
  onClick,
}) {
  const style = tones[tone] || tones.blue;

  const TrendIcon =
    trendDirection === "up"
      ? ArrowUpRight
      : trendDirection === "down"
        ? ArrowDownRight
        : Minus;

  const cardClasses = [
    "group relative overflow-hidden rounded-2xl border",
    "border-slate-800/80 bg-slate-900/70 p-5",
    "shadow-sm shadow-black/10 transition-all duration-200",
    "hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900",
    onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${style.accent} opacity-70`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">{title}</p>

          <p className="mt-3 break-words text-3xl font-semibold tracking-tight text-white">
            {value ?? "—"}
          </p>
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
          >
            <Icon size={21} strokeWidth={1.8} />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-4 flex min-h-5 flex-wrap items-center justify-between gap-2">
          {description && (
            <p className="text-xs leading-5 text-slate-500">{description}</p>
          )}

          {trend && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300">
              <TrendIcon size={14} />
              {trend}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClasses} w-full text-left`}
      >
        {content}
      </button>
    );
  }

  return <article className={cardClasses}>{content}</article>;
}
