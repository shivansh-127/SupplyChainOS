
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Factory,
  Package,
  ShieldAlert,
  Truck,
} from "lucide-react";

import MetricCard from "./MetricCard";
import ChartPanel from "./ChartPanel";
import SectionHeader from "./SectionHeader";

const numberFormat = new Intl.NumberFormat("en-IN");

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? numberFormat.format(number) : "—";
}

function formatDays(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)} days` : "—";
}

function getSeverityLabel(severity) {
  const value = Number(severity);

  if (value >= 8) return "Critical";
  if (value >= 6) return "High";
  if (value >= 4) return "Moderate";
  return "Low";
}

function getSeverityStyles(severity) {
  const value = Number(severity);

  if (value >= 8) {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (value >= 6) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  if (value >= 4) {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center">
      <CheckCircle2 size={22} className="mb-2 text-emerald-400" />
      <p className="text-sm text-slate-300">{message}</p>
    </div>
  );
}

function ActionLink({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 transition hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      {children}
      <ArrowRight size={14} />
    </button>
  );
}

export default function DashboardOverview({
  incidents = [],
  data = null,
  loading = false,
  onNavigate = () => {},
}) {
  const disruption = data?.disruption ?? null;
  const inventory = data?.inventory ?? {};
  const summary = data?.summary ?? {};
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const factories = Array.isArray(data?.affectedFactories)
    ? data.affectedFactories
    : [];

  const activeIncidents = incidents.filter(
    (item) => String(item.status ?? "").toLowerCase() === "active"
  );

  const criticalIncidents = activeIncidents.filter(
    (item) => Number(item.severity) >= 8
  );

  const affectedOrders = Number(summary.affectedOrders ?? 0);
  const totalShortage = Number(summary.totalShortage ?? 0);
  const coverageDays = Number(inventory.coverageDays);
  const totalInventory = Number(inventory.total ?? 0);

  const severityChartData = activeIncidents.map((item) => ({
    name: item.supplier || item.component || `Disruption ${item.id}`,
    severity: Number(item.severity ?? 0),
    delay: Number(item.delay_days ?? 0),
  }));

  const orderChartData = orders
    .filter((order) => Number(order.shortage ?? 0) > 0)
    .slice(0, 6)
    .map((order) => ({
      name: `Order ${order.id}`,
      allocated: Number(order.allocated ?? 0),
      shortage: Number(order.shortage ?? 0),
    }));

  const hasInventoryData = Number.isFinite(coverageDays);
  const coverageIsCritical = hasInventoryData && coverageDays <= 2;
  const coverageIsLow = hasInventoryData && coverageDays <= 5;

  const priorityDisruption =
    [...activeIncidents].sort(
      (a, b) => Number(b.severity ?? 0) - Number(a.severity ?? 0)
    )[0] ?? null;

  const prioritySupplier =
    disruption?.supplier ?? priorityDisruption?.supplier ?? "Supply network";

  const priorityComponent =
    disruption?.component ?? priorityDisruption?.component ?? "Affected component";

  const prioritySeverity =
    disruption?.severity ?? priorityDisruption?.severity;

  const hasPriorityIssue = Boolean(priorityDisruption || disruption);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">
      <SectionHeader
        eyebrow="SUPPLY CHAIN INTELLIGENCE"
        title="Control Tower"
        description="A unified view of operational risk, inventory exposure, and recovery priorities."
      />

      {/* Operational status */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Operational overview
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Monitor disruptions and identify the next action.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300">
            <span
              className={`h-2 w-2 rounded-full ${
                loading ? "animate-pulse bg-amber-400" : "bg-emerald-400"
              }`}
            />
            {loading ? "Refreshing operational data" : "Dashboard available"}
          </span>

          <button
            type="button"
            onClick={() => onNavigate("Disruption Workspace")}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          >
            Review disruptions
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <section aria-label="Key operational metrics">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            At a glance
          </h2>
          <span className="text-[11px] text-slate-500">
            Based on currently available records
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Active disruptions"
            value={formatNumber(activeIncidents.length)}
            description={`${formatNumber(criticalIncidents.length)} critical (severity ≥ 8)`}
            icon={AlertTriangle}
            tone="red"
            onClick={() => onNavigate("Disruption Workspace")}
          />

          <MetricCard
            title="Orders at risk"
            value={formatNumber(affectedOrders)}
            description="Affected orders for the selected disruption"
            icon={Package}
            tone="amber"
            onClick={() => onNavigate("Disruption Workspace")}
          />

          <MetricCard
            title="Inventory available"
            value={formatNumber(totalInventory)}
            description={
              hasInventoryData
                ? `Coverage: ${formatDays(coverageDays)}`
                : "Inventory coverage unavailable"
            }
            icon={Boxes}
            tone={coverageIsCritical ? "red" : coverageIsLow ? "amber" : "blue"}
            onClick={() => onNavigate("Inventory")}
          />

          <MetricCard
            title="Units short"
            value={formatNumber(totalShortage)}
            description="Estimated shortage for the selected disruption"
            icon={Truck}
            tone="amber"
            onClick={() => onNavigate("Disruption Workspace")}
          />
        </div>
      </section>

      {/* Priority action */}
      <section aria-label="Priority action">
        <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.09] via-slate-900 to-slate-900">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                <ShieldAlert size={22} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                    Priority review
                  </p>
                  {hasPriorityIssue && (
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getSeverityStyles(
                        prioritySeverity
                      )}`}
                    >
                      {getSeverityLabel(prioritySeverity)} severity
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                  {hasPriorityIssue
                    ? `${prioritySupplier} disruption`
                    : "Review your supply network"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {hasPriorityIssue
                    ? `${priorityComponent} is associated with an active disruption. Review the impact, validate inventory coverage, and compare recovery options before committing to an action.`
                    : "Open the disruption workspace to review operational records and assess any active supply risks."}
                </p>

                {hasPriorityIssue && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={14} className="text-amber-300" />
                      Delay:{" "}
                      {formatDays(
                        disruption?.delay_days ??
                          priorityDisruption?.delay_days
                      )}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Boxes size={14} className="text-sky-300" />
                      Inventory coverage:{" "}
                      {formatDays(inventory.coverageDays)}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Factory size={14} className="text-violet-300" />
                      Affected factories: {formatNumber(factories.length)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("Disruption Workspace")}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-sky-400/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:self-center"
            >
              Investigate impact
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section aria-label="Risk analytics">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200">
            Risk analytics
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Compare active disruption severity and shortages across affected
            orders.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartPanel
            title="Disruption severity"
            subtitle="Severity scores across active disruption records"
            data={severityChartData}
            type="bar"
            xKey="name"
            series={[
              {
                dataKey: "severity",
                name: "Severity",
                color: "#38bdf8",
              },
            ]}
            height={300}
            emptyMessage="No active disruptions are available to chart."
          />

          <ChartPanel
            title="Order allocation vs shortage"
            subtitle="Units allocated and units still short for affected orders"
            data={orderChartData}
            type="bar"
            xKey="name"
            series={[
              {
                dataKey: "allocated",
                name: "Allocated units",
                color: "#34d399",
              },
              {
                dataKey: "shortage",
                name: "Shortage units",
                color: "#fb7185",
              },
            ]}
            height={300}
            emptyMessage="No affected orders with shortages are available for the selected disruption."
          />
        </div>
      </section>

      {/* Disruption list */}
      <section aria-label="Active disruptions">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Active disruptions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Start with the highest-severity supplier or component risk.
            </p>
          </div>

          <ActionLink onClick={() => onNavigate("Disruption Workspace")}>
            Open disruption workspace
          </ActionLink>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          {activeIncidents.length === 0 ? (
            <div className="p-4">
              <EmptyState message="No active disruptions were returned by the backend." />
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_100px_110px] gap-4 border-b border-slate-800 bg-slate-950/50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
                <span>Supplier / component</span>
                <span>Disruption type</span>
                <span>Delay</span>
                <span>Severity</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {[...activeIncidents]
                  .sort(
                    (a, b) =>
                      Number(b.severity ?? 0) - Number(a.severity ?? 0)
                  )
                  .slice(0, 6)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 px-4 py-4 transition hover:bg-slate-800/30 sm:px-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_100px_110px] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {item.supplier || "Unknown supplier"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.component || "Component unavailable"}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs text-slate-300">
                          {item.type || "Supply disruption"}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-slate-300">
                          {formatDays(item.delay_days)}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${getSeverityStyles(
                            item.severity
                          )}`}
                        >
                          {getSeverityLabel(item.severity)} ·{" "}
                          {formatNumber(item.severity)}
                        </span>
                      </div>

                      <div className="md:text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate("Disruption Workspace")
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-sky-400/40 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        >
                          Investigate
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick navigation */}
      <section aria-label="Workspace shortcuts">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200">
            Continue your work
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Jump directly to the workspace you need.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => onNavigate("Inventory")}
            className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-sky-400/30 hover:bg-slate-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
              <Boxes size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-100">
                Inventory & coverage
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Review stock and supply exposure
              </span>
            </span>
            <ArrowRight
              size={16}
              className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-sky-300"
            />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("AI Copilot")}
            className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-violet-400/30 hover:bg-slate-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <BrainCircuit size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-100">
                AI decision copilot
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Ask questions and investigate risks
              </span>
            </span>
            <ArrowRight
              size={16}
              className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300"
            />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("Knowledge Center")}
            className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-emerald-400/30 hover:bg-slate-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <Activity size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-100">
                Knowledge & evidence
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Search indexed policies and documents
              </span>
            </span>
            <ArrowRight
              size={16}
              className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-300"
            />
          </button>
        </div>
      </section>

      <p className="border-t border-slate-800/80 pt-4 text-[11px] leading-5 text-slate-600">
        Decision support only. Validate live inventory, supplier capacity, lead
        times, and policy evidence before committing to a recovery action.
      </p>
    </div>
  );
}
