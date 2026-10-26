
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const chartTypes = {
  line: LineChart,
  area: AreaChart,
  bar: BarChart,
};

function formatValue(value, formatter) {
  if (typeof formatter === "function") {
    return formatter(value);
  }

  return typeof value === "number"
    ? new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : value;
}

function CustomTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>

      <div className="space-y-2">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-5"
          >
            <span className="flex items-center gap-2 text-xs text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name || item.dataKey}
            </span>

            <span className="text-xs font-semibold text-white">
              {formatValue(item.value, valueFormatter)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChartPanel({
  title,
  subtitle,
  data = [],
  type = "line",
  xKey = "name",
  series = [],
  height = 280,
  valueFormatter,
  emptyMessage = "No data available yet.",
  headerAction,
}) {
  const ChartComponent = chartTypes[type] || LineChart;

  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    series.length > 0;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-sm shadow-black/10">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>

          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {headerAction}
      </div>

      {hasData ? (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              data={data}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#273449"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey={xKey}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />

              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  formatValue(value, valueFormatter)
                }
                width={55}
              />

              <Tooltip
                content={
                  <CustomTooltip valueFormatter={valueFormatter} />
                }
                cursor={{ fill: "rgba(148, 163, 184, 0.06)" }}
              />

              {series.length > 1 && (
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "#cbd5e1",
                    paddingTop: "12px",
                  }}
                />
              )}

              {series.map((item, index) => {
                const color =
                  item.color ||
                  ["#38bdf8", "#34d399", "#fbbf24", "#fb7185"][
                    index % 4
                  ];

                if (type === "bar") {
                  return (
                    <Bar
                      key={item.dataKey}
                      dataKey={item.dataKey}
                      name={item.name || item.dataKey}
                      fill={color}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={42}
                    />
                  );
                }

                if (type === "area") {
                  return (
                    <Area
                      key={item.dataKey}
                      type="monotone"
                      dataKey={item.dataKey}
                      name={item.name || item.dataKey}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.12}
                      strokeWidth={2}
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  );
                }

                return (
                  <Line
                    key={item.dataKey}
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.name || item.dataKey}
                    stroke={color}
                    strokeWidth={2}
                    connectNulls={false}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/30 px-5 text-center"
          style={{ height }}
        >
          <div>
            <p className="text-sm text-slate-400">{emptyMessage}</p>
            <p className="mt-1 text-xs text-slate-600">
              The chart will appear when data is available.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
