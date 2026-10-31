
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Boxes,
  CheckCircle2,
  Clock3,
  FileText,
  Factory,
  LoaderCircle,
  Package,
  Search,
  Send,
  ShieldCheck,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import SectionHeader from "./components/dashboard/SectionHeader";
import ReactMarkdown from "react-markdown";

const API = "http://localhost:5000/api/disruptions";
const KNOWLEDGE_API = "http://localhost:5000/api/knowledge";
const SQL_API = "http://localhost:5000/api/nl-sql/ask";

const pages = {
  "Control Tower": {
    eyebrow: "OPERATIONS",
    title: "Control Tower",
    description: "Monitor supply risks and prioritize operational decisions.",
  },
  "Disruption Workspace": {
    eyebrow: "RISK MANAGEMENT",
    title: "Disruption Workspace",
    description: "Investigate impact, affected orders, and recovery options.",
  },
  Suppliers: {
    eyebrow: "SUPPLY NETWORK",
    title: "Supplier Network",
    description: "Review alternative suppliers and potential recovery paths.",
  },
  Inventory: {
    eyebrow: "SUPPLY NETWORK",
    title: "Inventory Intelligence",
    description: "Understand available stock, coverage, and shortage exposure.",
  },
  Shipments: {
    eyebrow: "SUPPLY NETWORK",
    title: "Shipment Monitor",
    description: "Review incoming shipments and their disruption exposure.",
  },
  "AI Copilot": {
    eyebrow: "DECISION INTELLIGENCE",
    title: "AI Copilot",
    description: "Ask questions about operations, policies, and supply risks.",
  },
  "Knowledge Center": {
    eyebrow: "KNOWLEDGE & EVIDENCE",
    title: "Knowledge Center",
    description: "Search indexed documents and manage your knowledge base.",
  },
};

function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("en-IN");
}

function formatDays(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `${Number(value).toFixed(2)} days`;
}

function formatCurrency(value) {
  if (value == null || !Number.isFinite(Number(value))) return "Unknown";
  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
}

function severityClass(value) {
  const severity = Number(value);

  if (severity >= 8) return "border-red-500/20 bg-red-500/10 text-red-300";
  if (severity >= 6) return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  if (severity >= 4) return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

function severityLabel(value) {
  const severity = Number(value);

  if (severity >= 8) return "Critical";
  if (severity >= 6) return "High";
  if (severity >= 4) return "Moderate";

  return "Low";
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/50 ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className = "",
}) {
  const styles =
    variant === "primary"
      ? "border border-sky-300/20 bg-sky-400 text-slate-950 hover:bg-sky-300"
      : variant === "danger"
        ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15"
        : "border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="block text-xs font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10";

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
      <XCircle size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function SuccessMessage({ children }) {
  if (!children) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function LoadingState({ label = "Loading data..." }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">
      <LoaderCircle size={18} className="animate-spin text-sky-300" />
      {label}
    </div>
  );
}

function EmptyState({ children = "No records available for this view." }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 px-5 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

function DataTable({ columns, rows, rowKey }) {
  if (!rows?.length) {
    return <EmptyState>No matching records were returned by the backend.</EmptyState>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 font-semibold first:pl-0">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {rows.map((row, index) => (
            <tr
              key={rowKey ? rowKey(row) : row.id ?? index}
              className="transition hover:bg-slate-800/20"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="max-w-[320px] px-3 py-4 align-top text-slate-300 first:pl-0"
                >
                  {column.render
                    ? column.render(row)
                    : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function ResultViewer({ title, result }) {
  if (result == null) return null;

  const disruptionFields = [
    { key: "summary", label: "Executive summary", accent: "sky" },
    { key: "reasoning", label: "Analysis and reasoning", accent: "default" },
    { key: "keyRisks", label: "Key risks", accent: "red" },
    {
      key: "recommendedNextSteps",
      label: "Recommended next steps",
      accent: "green",
    },
    { key: "uncertainties", label: "Uncertainties and assumptions", accent: "amber" },
  ];

  const orderFields = [
    { key: "explanation", label: "Why this order is affected", accent: "sky" },
    { key: "evidence", label: "Supporting evidence", accent: "default" },
    { key: "recommendedActions", label: "Recommended actions", accent: "green" },
    { key: "uncertainties", label: "Uncertainties and assumptions", accent: "amber" },
  ];

  const fields =
    result.recommendedNextSteps || result.keyRisks
      ? disruptionFields
      : result.recommendedActions && result.explanation
        ? orderFields
        : [];

  const visibleFields = fields.filter(
    ({ key }) => result[key] != null
  );

  const colors = {
    sky: "border-sky-400/20 bg-sky-400/[0.05]",
    red: "border-red-400/20 bg-red-400/[0.05]",
    green: "border-emerald-400/20 bg-emerald-400/[0.05]",
    amber: "border-amber-400/20 bg-amber-400/[0.05]",
    default: "border-slate-800 bg-slate-950/50",
  };

  
  function renderMarkdown(value) {
    return (
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-xl font-bold text-white first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-lg font-bold text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-sky-300 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-sm leading-7 text-slate-300 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-5 list-disc space-y-2 text-sm leading-6 text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm leading-6 text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          hr: () => <hr className="my-5 border-slate-700" />,
        }}
      >
        {String(value ?? "")}
      </ReactMarkdown>
    );
  }


  function renderValue(value) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <p className="text-sm text-slate-500">No items reported.</p>;
      }

      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              <span>
                {typeof item === "object" && item !== null
                  ? JSON.stringify(item)
                  : String(item)}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return (
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {String(value)}
      </p>
    );
  }

  return (
    <Panel
      title={title}
      subtitle={
        fields.length > 0
          ? "AI-generated decision support. Review the evidence before acting."
          : "Structured response from the backend."
      }
    >
      {visibleFields.length > 0 ? (
        <div className="space-y-4">
          {visibleFields.map(({ key, label, accent }) => (
            <section
              key={key}
              className={`rounded-xl border p-4 sm:p-5 ${colors[accent] ?? colors.default}`}
            >
              <h3 className="mb-3 text-sm font-semibold text-slate-100">
                {label}
              </h3>
              {renderValue(result[key])}
            </section>
          ))}

          {result.assessedSeverity != null && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <span className="text-sm text-slate-400">AI-assessed severity</span>
              <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-300">
                {result.assessedSeverity}/10
              </span>
            </div>
          )}

          {result.eventCategory && (
            <p className="text-xs text-slate-500">
              Event category: {result.eventCategory}
            </p>
          )}

          {result.confidence != null && (
            <p className="text-xs text-slate-500">
              Model-reported confidence: {result.confidence}
              <span className="ml-1">
                (not necessarily a calibrated probability)
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="mb-3 text-xs text-slate-500">
            Readable response
          </p>
          {(() => {
              const answer =
                result.answer ??
                result.response ??
                result.message ??
                result.explanation;

              if (typeof answer === "string") {
                return renderMarkdown(answer);
              }

              return renderValue(
                answer ??
                  "The backend returned a response without a recognized summary field."
              );
            })()}
        </div>
      )}

      <details className="mt-5 border-t border-slate-800 pt-4">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 transition hover:text-slate-300">
          Developer details · Inspect raw JSON
        </summary>
        <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-400">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </Panel>
  );
}   /////////////////////////////////////////////



function AnswerPanel({ title, result, error }) {
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!result) return null;

  const answer =
    result.answer ??
    result.explanation ??
    result.response ??
    result.message;

  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-5 text-xl font-bold text-white first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-5 text-lg font-bold text-white first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-base font-semibold text-sky-300 first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-7 text-slate-300 last:mb-0">
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 ml-5 list-disc space-y-2 text-sm leading-6 text-slate-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm leading-6 text-slate-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-sky-500 pl-4 text-slate-400">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300">
        {children}
      </code>
    ),
  };

  return (
    <Panel title={title} subtitle="AI-generated result">
      {answer != null && (
        <div className="text-sm leading-7 text-slate-200">
          {typeof answer === "string" ? (
            <ReactMarkdown components={markdownComponents}>
              {answer}
            </ReactMarkdown>
          ) : (
            <pre className="overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
              {JSON.stringify(answer, null, 2)}
            </pre>
          )}
        </div>
      )}

      {result.sources?.length > 0 && (
        <div className="mt-5 border-t border-slate-800 pt-4">
          <h3 className="mb-3 text-xs font-semibold text-slate-200">
            Sources and evidence
          </h3>

          <div className="space-y-3">
            {result.sources.map((source, index) => (
              <div
                key={source.id ?? source.source ?? index}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
              >
                <p className="text-xs font-medium text-sky-300">
                  {source.title ??
                    source.source ??
                    source.filename ??
                    `Source ${index + 1}`}
                </p>

                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">
                  {source.content ?? source.text ?? source.excerpt ?? ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="mt-4 border-t border-slate-800 pt-4">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-300">
          Inspect complete response
        </summary>

        <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-400">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </Panel>
  );
}


function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeSection, setActiveSection] = useState("Control Tower");
  const [data, setData] = useState(null);
  const [mitigation, setMitigation] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingMitigation, setLoadingMitigation] = useState(false);
  const [error, setError] = useState("");
  const [mitigationError, setMitigationError] = useState("");

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderAnalysis, setOrderAnalysis] = useState(null);
  const [loadingOrderAnalysis, setLoadingOrderAnalysis] = useState(false);
  const [orderAnalysisError, setOrderAnalysisError] = useState("");

  const [knowledgeQuestion, setKnowledgeQuestion] = useState("");
  const [knowledgeResult, setKnowledgeResult] = useState(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState("");

  const [hybridQuestion, setHybridQuestion] = useState("");
  const [hybridResult, setHybridResult] = useState(null);
  const [loadingHybrid, setLoadingHybrid] = useState(false);
  const [hybridError, setHybridError] = useState("");

  const [sqlQuestion, setSqlQuestion] = useState("");
  const [sqlResult, setSqlResult] = useState(null);
  const [loadingSql, setLoadingSql] = useState(false);
  const [sqlError, setSqlError] = useState("");

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
const [creatingDisruption, setCreatingDisruption] = useState(false);
const [createDisruptionError, setCreateDisruptionError] = useState("");
const [createDisruptionMessage, setCreateDisruptionMessage] = useState("");

const [supplierOptions, setSupplierOptions] = useState([]);
const [componentOptions, setComponentOptions] = useState([]);
const [loadingOptions, setLoadingOptions] = useState(false);
const [deletingDisruptionId, setDeletingDisruptionId] = useState(null);
const [disruptionToDelete, setDisruptionToDelete] = useState(null);

const [newDisruption, setNewDisruption] = useState({
  supplier_id: "1",
  component_id: "1",
  type: "SUPPLY_DELAY",
  severity: "5",
  description: "",
  reason: "",
  delay_days: "3",
  status: "ACTIVE",
  expected_resolution_date: "",
});

  const orderRequestId = useRef(0);
  const aiRequestId = useRef(0);

  useEffect(() => {
  let cancelled = false;

  async function loadDisruptionOptions() {
    setLoadingOptions(true);

    try {
      const response = await fetch(`${API}/options`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load supplier and component options."
        );
      }

      if (!cancelled) {
        setSupplierOptions(result.suppliers || []);
        setComponentOptions(result.components || []);
      }
    } catch (err) {
      if (!cancelled) {
        setCreateDisruptionError(err.message);
      }
    } finally {
      if (!cancelled) {
        setLoadingOptions(false);
      }
    }
  }

  loadDisruptionOptions();

  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      setLoadingList(true);
      setError("");

      try {
        const response = await fetch(API);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || result.error || "Failed to load disruptions.");
        }

        if (cancelled) return;

        const records = Array.isArray(result) ? result : result.data ?? [];
        setIncidents(records);

        if (records.length > 0) {
          setSelectedId((current) =>
            records.some((record) => String(record.id) === current)
              ? current
              : String(records[0].id)
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }

    loadIncidents();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      setMitigation(null);
      return;
    }

    let cancelled = false;

    async function loadImpact() {
      setLoadingImpact(true);
      setError("");
      setData(null);

      try {
        const response = await fetch(`${API}/${selectedId}/impact`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || result.error || "Failed to load disruption impact.");
        }

        if (!cancelled) setData(result.data ?? result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingImpact(false);
      }
    }

    async function loadMitigation() {
      setLoadingMitigation(true);
      setMitigationError("");
      setMitigation(null);

      try {
        const response = await fetch(`${API}/${selectedId}/mitigation`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || result.error || "Failed to load mitigation options.");
        }

        if (!cancelled) setMitigation(result.data ?? result);
      } catch (err) {
        if (!cancelled) setMitigationError(err.message);
      } finally {
        if (!cancelled) setLoadingMitigation(false);
      }
    }

    loadImpact();
    loadMitigation();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    aiRequestId.current += 1;
    orderRequestId.current += 1;

    setAiAnalysis(null);
    setAiError("");
    setLoadingAI(false);

    setSelectedOrder(null);
    setOrderAnalysis(null);
    setOrderAnalysisError("");
    setLoadingOrderAnalysis(false);

    setHybridResult(null);
    setHybridError("");
    setLoadingHybrid(false);
  }, [selectedId]);

  function handleNavigate(section) {
    if (!pages[section]) return;
    setActiveSection(section);
  }
  
  async function handleCreateDisruption(event) {
    event.preventDefault();

    setCreateDisruptionError("");
    setCreateDisruptionMessage("");

    const payload = {
      ...newDisruption,
      supplier_id: Number(newDisruption.supplier_id),
      component_id: Number(newDisruption.component_id),
      severity: Number(newDisruption.severity),
      delay_days: Number(newDisruption.delay_days),
    };

    if (
      !Number.isInteger(payload.supplier_id) ||
      payload.supplier_id <= 0 ||
      !Number.isInteger(payload.component_id) ||
      payload.component_id <= 0
    ) {
      setCreateDisruptionError("Enter valid supplier and component IDs.");
      return;
    }

    if (
      !payload.description.trim() ||
      !payload.reason.trim() ||
      !Number.isFinite(payload.severity) ||
      payload.severity < 1 ||
      payload.severity > 10 ||
      !Number.isInteger(payload.delay_days) ||
      payload.delay_days < 0 ||
      !payload.expected_resolution_date
    ) {
      setCreateDisruptionError(
        "Complete all required fields with valid values."
      );
      return;
    }

    setCreatingDisruption(true);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.details ||
            result.error ||
            result.message ||
            "Failed to create disruption."
        );
      }

      const created = result.data ?? result;

      const listResponse = await fetch(API);
      const listResult = await listResponse.json();

      if (!listResponse.ok) {
        throw new Error(
          "Disruption was created, but the list could not be refreshed. Refresh the page."
        );
      }

      const records = Array.isArray(listResult)
        ? listResult
        : listResult.data ?? [];

      setIncidents(records);
      setSelectedId(String(created.id));
      setCreateDisruptionMessage(
        `Disruption #${created.id} created successfully.`
      );
      setNewDisruption((current) => ({
        ...current,
        description: "",
        reason: "",
      }));
      setShowCreateForm(false);
    } catch (err) {
      setCreateDisruptionError(err.message);
    } finally {
      setCreatingDisruption(false);
    }
  }

  async function handleDeleteDisruption(id) {
  setDeletingDisruptionId(id);
  setCreateDisruptionError("");
  setCreateDisruptionMessage("");

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.details || result.error || result.message ||
        "Failed to delete disruption."
      );
    }

    const listResponse = await fetch(API);
    const listResult = await listResponse.json();

    if (!listResponse.ok) {
      throw new Error(
        "Deleted successfully, but the list could not refresh. Please refresh the page."
      );
    }

    const records = Array.isArray(listResult)
      ? listResult
      : listResult.data ?? [];

    setIncidents(records);

    if (String(selectedId) === String(id)) {
      setSelectedId(records.length > 0 ? String(records[0].id) : "");
    }

    setDisruptionToDelete(null);

    setCreateDisruptionMessage(
      result.message || `Disruption #${id} deleted successfully.`
    );
  } catch (err) {
    setCreateDisruptionError(err.message);
  } finally {
    setDeletingDisruptionId(null);
  }
}


  async function handleAIInvestigation() {
    if (!selectedId) return;

    const requestId = ++aiRequestId.current;
    setLoadingAI(true);
    setAiError("");
    setAiAnalysis(null);

    try {
      const response = await fetch(`${API}/${selectedId}/investigate`, {
        method: "POST",
      });

      const result = await response.json();

      if (requestId !== aiRequestId.current) return;

      if (!response.ok) {
        throw new Error(result.details || result.error || "AI investigation failed.");
      }

      setAiAnalysis(result.data ?? result);
    } catch (err) {
      if (requestId === aiRequestId.current) {
        setAiError(err.message || "AI investigation failed.");
      }
    } finally {
      if (requestId === aiRequestId.current) setLoadingAI(false);
    }
  }

  async function handleOrderInvestigation() {
    if (!selectedId || !selectedOrder) return;

    const requestId = ++orderRequestId.current;
    const disruptionId = selectedId;
    const orderId = selectedOrder.id;

    setLoadingOrderAnalysis(true);
    setOrderAnalysisError("");
    setOrderAnalysis(null);

    try {
      const response = await fetch(
        `${API}/${disruptionId}/orders/${orderId}/investigate`,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "Order investigation failed.");
      }

      if (requestId !== orderRequestId.current) return;
      setOrderAnalysis(result.data ?? result);
    } catch (err) {
      if (requestId === orderRequestId.current) {
        setOrderAnalysisError(err.message);
      }
    } finally {
      if (requestId === orderRequestId.current) setLoadingOrderAnalysis(false);
    }
  }

  async function handleKnowledgeQuestion(event) {
    event.preventDefault();

    const question = knowledgeQuestion.trim();
    if (!question) {
      setKnowledgeError("Please enter a question.");
      return;
    }

    setLoadingKnowledge(true);
    setKnowledgeError("");
    setKnowledgeResult(null);

    try {
      const response = await fetch(`${KNOWLEDGE_API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.details || result.error || "Knowledge question failed.");
      }

      setKnowledgeResult(result.data ?? result);
    } catch (err) {
      setKnowledgeError(err.message || "Unable to query the knowledge base.");
    } finally {
      setLoadingKnowledge(false);
    }
  }

  async function handleHybridQuestion(event) {
    event.preventDefault();

    const question = hybridQuestion.trim();

    if (!question) {
      setHybridError("Please enter a question.");
      return;
    }

    if (!selectedId) {
      setHybridError("Select a disruption before asking a question.");
      return;
    }

    setLoadingHybrid(true);
    setHybridError("");
    setHybridResult(null);

    try {
      const response = await fetch(`${KNOWLEDGE_API}/ask-disruption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          disruptionId: Number(selectedId),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.details || result.error || "Hybrid AI question failed.");
      }

      setHybridResult(result.data ?? result);
    } catch (err) {
      setHybridError(err.message || "Unable to query operational and policy evidence.");
    } finally {
      setLoadingHybrid(false);
    }
  }

  async function handleSqlQuestion(event) {
    event.preventDefault();

    const question = sqlQuestion.trim();

    if (!question) {
      setSqlError("Please enter a question.");
      return;
    }

    setLoadingSql(true);
    setSqlError("");
    setSqlResult(null);

    try {
      const response = await fetch(SQL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.details || result.error || "Database question failed.");
      }

      setSqlResult(result.data ?? result);
    } catch (err) {
      setSqlError(err.message || "Unable to answer from operational data.");
    } finally {
      setLoadingSql(false);
    }
  }

  async function handleDocumentUpload(event) {
    event.preventDefault();

    if (!uploadFile) {
      setUploadError("Choose a PDF or TXT file first.");
      setUploadMessage("");
      return;
    }

    const formData = new FormData();
    formData.append("document", uploadFile);

    if (uploadTitle.trim()) {
      formData.append("title", uploadTitle.trim());
    }

    setUploadingDocument(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const response = await fetch(`${KNOWLEDGE_API}/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.details || result.error || "Document ingestion failed.");
      }

      const uploaded = result.data ?? result;

      setUploadMessage(
        uploaded.replaced
          ? `Replaced "${uploaded.title}" successfully. ${uploaded.chunksIndexed} chunk(s) indexed.`
          : `Indexed "${uploaded.title}" successfully. ${uploaded.chunksIndexed} chunk(s) added to the knowledge base.`
      );

      setUploadFile(null);
      setUploadTitle("");
      event.target.reset();
    } catch (err) {
      setUploadError(err.message || "Unable to ingest this document.");
    } finally {
      setUploadingDocument(false);
    }
  }

  const selectedIncident =
    incidents.find((incident) => String(incident.id) === String(selectedId)) ?? null;

  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const factories = Array.isArray(data?.affectedFactories) ? data.affectedFactories : [];
  const shipments = Array.isArray(data?.incomingShipments) ? data.incomingShipments : [];
  const alternativeSuppliers = Array.isArray(data?.alternativeSuppliers)
    ? data.alternativeSuppliers
    : [];

  const page = pages[activeSection] ?? pages["Control Tower"];

  function renderDisruptionSelector() {
  return (
    <Panel
      title="Select a disruption"
      subtitle="Impact, mitigation, and investigations are scoped to the selected record."
    >
      {incidents.length === 0 ? (
        <EmptyState>No disruptions were returned by the backend.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {incidents.map((incident) => {
            const active = String(incident.id) === String(selectedId);
            const deleting = deletingDisruptionId === incident.id;

            return (
              <div
                key={incident.id}
                className={`rounded-xl border p-4 transition ${
                  active
                    ? "border-sky-400/40 bg-sky-400/[0.07]"
                    : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(String(incident.id))}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {incident.supplier ?? "Unknown supplier"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {incident.component ?? "Component unavailable"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold ${severityClass(
                        incident.severity
                      )}`}
                    >
                      {severityLabel(incident.severity)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                    <span>{incident.type ?? "Disruption"}</span>
                    <span>Severity {formatNumber(incident.severity)}</span>
                    <span>Delay {formatDays(incident.delay_days)}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                    <span className="text-[11px] text-slate-500">
                      {incident.status ?? "Status unavailable"}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-300">
                      {active ? "Selected" : "View impact"}
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </button>

                <div className="mt-3 flex justify-end">
                  <Button
                    variant="danger"
                    onClick={() => setDisruptionToDelete(incident)}
                    disabled={deletingDisruptionId !== null}
                  >
                    {deleting ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {deleting ? "Deleting..." : "Delete disruption"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

  
function renderDisruptionWorkspace() {
  return (
    <div className="space-y-5">
      <Panel
        title="Create a new disruption"
        subtitle="Register a new supplier or component disruption in the operational database."
        action={
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((value) => !value);
              setCreateDisruptionError("");
            }}
            className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
          >
            {showCreateForm ? "Close form" : "+ Add disruption"}
          </button>
        }
      >
        <SuccessMessage>{createDisruptionMessage}</SuccessMessage>
        <ErrorMessage>{createDisruptionError}</ErrorMessage>

        {showCreateForm && (
          <form
            onSubmit={handleCreateDisruption}
            className="mt-4 space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Supplier">
                <select
                  className={inputClass}
                  value={newDisruption.supplier_id}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      supplier_id: event.target.value,
                    }))
                  }
                  required
                  disabled={loadingOptions}
                >
                  <option value="">Select supplier</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={String(supplier.id)}>
                      {supplier.name} — {supplier.location}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Affected component">
                <select
                  className={inputClass}
                  value={newDisruption.component_id}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      component_id: event.target.value,
                    }))
                  }
                  required
                  disabled={loadingOptions}
                >
                  <option value="">Select component</option>
                  {componentOptions.map((component) => (
                    <option key={component.id} value={String(component.id)}>
                      {component.name} — {component.category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Disruption type">
                <select
                  className={inputClass}
                  value={newDisruption.type}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="SUPPLY_DELAY">Supply delay</option>
                  <option value="TRANSPORT_DISRUPTION">Transport disruption</option>
                  <option value="QUALITY_ISSUE">Quality issue</option>
                  <option value="PRODUCTION_OUTAGE">Production outage</option>
                </select>
              </Field>

              <Field label="Severity (1–10)">
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={newDisruption.severity}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      severity: event.target.value,
                    }))
                  }
                  required
                />
              </Field>

              <Field label="Delay (days)">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="1"
                  value={newDisruption.delay_days}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      delay_days: event.target.value,
                    }))
                  }
                  required
                />
              </Field>

              <Field label="Expected resolution date">
                <input
                  className={inputClass}
                  type="date"
                  value={newDisruption.expected_resolution_date}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      expected_resolution_date: event.target.value,
                    }))
                  }
                  required
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputClass}
                  value={newDisruption.status}
                  onChange={(event) =>
                    setNewDisruption((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="MONITORING">Monitoring</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                value={newDisruption.description}
                onChange={(event) =>
                  setNewDisruption((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe what happened..."
                required
              />
            </Field>

            <Field label="Reason">
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                value={newDisruption.reason}
                onChange={(event) =>
                  setNewDisruption((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Explain the cause of the disruption..."
                required
              />
            </Field>

            {loadingOptions && (
              <p className="text-xs text-slate-400">
                Loading suppliers and components...
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  creatingDisruption ||
                  loadingOptions ||
                  supplierOptions.length === 0 ||
                  componentOptions.length === 0
                }
              >
                {creatingDisruption
                  ? "Creating..."
                  : "Create disruption"}
              </Button>
            </div>
          </form>
        )}
      </Panel>

      {renderDisruptionSelector()}


        {error && <ErrorMessage>{error}</ErrorMessage>}
        {loadingImpact && <LoadingState label="Loading disruption impact..." />}

        {!loadingImpact && data && (
          <>
            <Panel
              title="Disruption overview"
              subtitle="Core details returned by the impact analysis endpoint."
              action={
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${severityClass(
                  data.disruption?.severity
                )}`}>
                  {severityLabel(data.disruption?.severity)}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Supplier", data.disruption?.supplier ?? "Unknown"],
                  ["Component", data.disruption?.component ?? "Unknown"],
                  ["Disruption type", data.disruption?.type ?? "Unknown"],
                  ["Expected resolution", formatDate(data.disruption?.expected_resolution_date)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-100">{value}</p>
                  </div>
                ))}
              </div>

              {data.disruption?.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                  {data.disruption.description}
                </p>
              )}
            </Panel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Available inventory",
                  value: formatNumber(data.inventory?.total),
                  detail: "Units across listed warehouses",
                  icon: Boxes,
                },
                {
                  label: "Inventory coverage",
                  value: formatDays(data.inventory?.coverageDays),
                  detail: "At current daily requirement",
                  icon: Clock3,
                },
                {
                  label: "Potential supply gap",
                  value: formatDays(data.supplyGapDays),
                  detail: "Estimated exposure",
                  icon: AlertTriangle,
                },
                {
                  label: "Affected orders",
                  value: formatNumber(data.summary?.affectedOrders),
                  detail: `${formatNumber(data.summary?.totalShortage)} product units short`,
                  icon: Package,
                },
              ].map((metric) => {
                const Icon = metric.icon;

                return (
                  <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <Icon size={18} className="text-sky-300" />
                    <p className="mt-4 text-xs text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
                    <p className="mt-2 text-xs text-slate-500">{metric.detail}</p>
                  </div>
                );
              })}
            </div>

            <Panel
              title="Customer order impact"
              subtitle="Select an order to run its AI investigation."
            >
              <DataTable
                rowKey={(row) => row.id}
                rows={orders}
                columns={[
                  { key: "id", label: "Order", render: (row) => `#${row.id}` },
                  { key: "product", label: "Product" },
                  { key: "quantity", label: "Ordered", render: (row) => formatNumber(row.quantity) },
                  { key: "allocated", label: "Allocated", render: (row) => formatNumber(row.allocated) },
                  {
                    key: "shortage",
                    label: "Shortage",
                    render: (row) => (
                      <span className={Number(row.shortage) > 0 ? "font-semibold text-red-300" : "text-emerald-300"}>
                        {formatNumber(row.shortage)}
                      </span>
                    ),
                  },
                  {
                    key: "investigate",
                    label: "Investigation",
                    render: (row) => (
                      <Button
                        variant={selectedOrder?.id === row.id ? "primary" : "secondary"}
                        onClick={() => {
                          setSelectedOrder(row);
                          setOrderAnalysis(null);
                          setOrderAnalysisError("");
                        }}
                      >
                        {selectedOrder?.id === row.id ? "Selected" : "Select order"}
                      </Button>
                    ),
                  },
                ]}
              />

              {selectedOrder && (
                <div className="mt-5 rounded-xl border border-sky-400/20 bg-sky-400/[0.04] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Investigate order #{selectedOrder.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedOrder.product} · shortage {formatNumber(selectedOrder.shortage)} units
                      </p>
                    </div>
                    <Button
                        onClick={handleOrderInvestigation}
                        disabled={
                          loadingOrderAnalysis ||
                          Number(selectedOrder.shortage) <= 0
                        }
                        >
                        {loadingOrderAnalysis && (
                          <LoaderCircle size={15} className="animate-spin" />
                        )}
                        Run order investigation
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <ErrorMessage>{orderAnalysisError}</ErrorMessage>
                    {orderAnalysis && <ResultViewer title="Order investigation result" result={orderAnalysis} />}
                  </div>
                </div>
              )}
            </Panel>

            <Panel
              title="Affected factories"
              subtitle="Production capacity exposed to the selected disruption."
            >
              <DataTable
                rows={factories}
                rowKey={(row) => `${row.name}-${row.product_id}`}
                columns={[
                  { key: "name", label: "Factory" },
                  { key: "location", label: "Location" },
                  { key: "product", label: "Product" },
                  { key: "daily_capacity", label: "Daily capacity", render: (row) => formatNumber(row.daily_capacity) },
                  { key: "potential_production_loss", label: "Production exposure", render: (row) => formatNumber(row.potential_production_loss) },
                ]}
              />
            </Panel>

            <Panel
              title="Recovery options"
              subtitle="Backend-generated estimates. Verify supplier capacity, prices, and arrival dates before committing."
              action={
                <Button
                  variant="secondary"
                  onClick={async () => {
                    setLoadingMitigation(true);
                    setMitigationError("");

                    try {
                      const response = await fetch(`${API}/${selectedId}/mitigation`);
                      const result = await response.json();

                      if (!response.ok) {
                        throw new Error(result.details || result.error || "Could not refresh mitigation.");
                      }

                      setMitigation(result.data ?? result);
                    } catch (err) {
                      setMitigationError(err.message);
                    } finally {
                      setLoadingMitigation(false);
                    }
                  }}
                  disabled={loadingMitigation}
                >
                  {loadingMitigation && <LoaderCircle size={15} className="animate-spin" />}
                  Refresh estimates
                </Button>
              }
            >
              <ErrorMessage>{mitigationError}</ErrorMessage>

              {loadingMitigation && <LoadingState label="Loading recovery estimates..." />}

              {!loadingMitigation && mitigation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {[
                      {
                        title: "Emergency procurement",
                        option: mitigation.options?.emergencyProcurement,
                        description: "Estimated alternate-source procurement.",
                      },
                      {
                        title: "Wait for original supplier",
                        option: mitigation.options?.waitForOriginalSupplier,
                        description: "Estimated impact of waiting for recovery.",
                      },
                      {
                        title: "Adjust production",
                        option: mitigation.options?.adjustProduction,
                        description: "Production rescheduling option.",
                      },
                    ].map(({ title, option, description }) => (
                      <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
                        <p className="mt-4 text-xs font-medium text-sky-300">
                          {option?.status ?? "Estimate unavailable"}
                        </p>
                        {option?.estimatedCost != null && (
                          <p className="mt-2 text-lg font-semibold text-white">
                            {formatCurrency(option.estimatedCost)}
                          </p>
                        )}
                        {option?.estimatedSupplyGapDays != null && (
                          <p className="mt-2 text-xs text-slate-400">
                            Supply gap: {formatDays(option.estimatedSupplyGapDays)}
                          </p>
                        )}
                        {option?.leadTimeDays != null && (
                          <p className="mt-2 text-xs text-slate-400">
                            Lead time: {formatDays(option.leadTimeDays)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <details className="rounded-xl border border-slate-800 p-4">
                    <summary className="cursor-pointer text-xs font-medium text-slate-400">
                      Inspect complete mitigation response
                    </summary>
                    <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                      {JSON.stringify(mitigation, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </Panel>

            <Panel
              title="AI disruption investigation"
              subtitle="Ask the existing investigation endpoint to analyze this disruption."
              action={
                <Button onClick={handleAIInvestigation} disabled={loadingAI}>
                  {loadingAI && <LoaderCircle size={15} className="animate-spin" />}
                  Investigate disruption
                </Button>
              }
            >
              <ErrorMessage>{aiError}</ErrorMessage>
              {loadingAI && <LoadingState label="Investigating the selected disruption..." />}
              {aiAnalysis && <ResultViewer title="Investigation result" result={aiAnalysis} />}
              {!aiAnalysis && !loadingAI && !aiError && (
                <EmptyState>
                  Run an investigation to see the analysis here.
                </EmptyState>
              )}
            </Panel>
          </>
        )}
           {disruptionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <AlertTriangle className="text-red-400" size={22} />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Delete disruption?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Are you sure you want to delete disruption{" "}
                  <span className="font-semibold text-white">
                    #{disruptionToDelete.id}
                  </span>{" "}
                  associated with{" "}
                  <span className="font-semibold text-slate-200">
                    {disruptionToDelete.supplier}
                  </span>
                  ?
                </p>

                <p className="mt-2 text-xs text-red-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDisruptionToDelete(null)}
                disabled={deletingDisruptionId !== null}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                onClick={() =>
                  handleDeleteDisruption(disruptionToDelete.id)
                }
                disabled={deletingDisruptionId !== null}
              >
                {deletingDisruptionId !== null ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  function renderInventory() {
    return (
      <div className="space-y-5">
        <Panel
          title="Selected component inventory"
          subtitle="Inventory figures from the selected disruption's impact analysis."
          action={
            <select
              aria-label="Select disruption"
              className={`${inputClass} max-w-[250px]`}
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {incidents.map((incident) => (
                <option key={incident.id} value={String(incident.id)}>
                  {incident.supplier} — {incident.component}
                </option>
              ))}
            </select>
          }
        >
          {loadingImpact ? (
            <LoadingState label="Loading inventory impact..." />
          ) : data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["Available inventory", formatNumber(data.inventory?.total), Boxes],
                ["Daily requirement", formatNumber(data.inventory?.dailyRequirement), Activity],
                ["Coverage", formatDays(data.inventory?.coverageDays), Clock3],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <Icon size={18} className="text-sky-300" />
                  <p className="mt-4 text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Select a disruption to load its inventory impact.</EmptyState>
          )}
        </Panel>

        {data && (
          <>
            <Panel title="Supply exposure" subtitle="Estimates derived from the selected disruption.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-500">Potential supply gap</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-300">{formatDays(data.supplyGapDays)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-500">Component</p>
                  <p className="mt-2 text-lg font-semibold text-white">{data.disruption?.component ?? "Unknown"}</p>
                </div>
              </div>
            </Panel>

            <Panel title="Affected factories" subtitle="Factories exposed to this component shortage.">
              <DataTable
                rows={factories}
                columns={[
                  { key: "name", label: "Factory" },
                  { key: "location", label: "Location" },
                  { key: "product", label: "Product" },
                  { key: "daily_capacity", label: "Daily capacity", render: (row) => formatNumber(row.daily_capacity) },
                  { key: "potential_production_loss", label: "Production exposure", render: (row) => formatNumber(row.potential_production_loss) },
                ]}
              />
            </Panel>
          </>
        )}
      </div>
    );
  }

  function renderSuppliers() {
    return (
      <div className="space-y-5">
        <Panel
          title="Alternative suppliers"
          subtitle="Configured alternatives for the selected disrupted component."
          action={
            <select
              aria-label="Select disruption"
              className={`${inputClass} max-w-[250px]`}
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {incidents.map((incident) => (
                <option key={incident.id} value={String(incident.id)}>
                  {incident.supplier} — {incident.component}
                </option>
              ))}
            </select>
          }
        >
          {loadingImpact ? (
            <LoadingState label="Loading alternative supplier data..." />
          ) : (
            <DataTable
              rows={alternativeSuppliers}
              rowKey={(row) => row.supplier_id ?? row.supplier}
              columns={[
                { key: "supplier", label: "Supplier" },
                { key: "location", label: "Location" },
                { key: "lead_time_days", label: "Lead time", render: (row) => formatDays(row.lead_time_days) },
                { key: "unit_cost", label: "Unit cost", render: (row) => formatCurrency(row.unit_cost) },
                { key: "minimum_order_quantity", label: "Minimum order", render: (row) => formatNumber(row.minimum_order_quantity) },
                { key: "risk_score", label: "Risk score", render: (row) => formatNumber(row.risk_score) },
              ]}
            />
          )}
        </Panel>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <div className="flex gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Verify before procurement</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                A configured alternative supplier is not proof of available stock or confirmed capacity.
                Validate actual availability, contractual terms, transport, and delivery timing before placing an order.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderShipments() {
    return (
      <div className="space-y-5">
        <Panel
          title="Incoming shipments"
          subtitle="Inbound shipment records associated with the selected disruption."
          action={
            <select
              aria-label="Select disruption"
              className={`${inputClass} max-w-[250px]`}
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {incidents.map((incident) => (
                <option key={incident.id} value={String(incident.id)}>
                  {incident.supplier} — {incident.component}
                </option>
              ))}
            </select>
          }
        >
          {loadingImpact ? (
            <LoadingState label="Loading inbound shipments..." />
          ) : (
            <DataTable
              rows={shipments}
              columns={[
                { key: "supplier", label: "Supplier" },
                { key: "warehouse", label: "Warehouse" },
                { key: "quantity", label: "Quantity", render: (row) => formatNumber(row.quantity) },
                { key: "expected_date", label: "Expected date", render: (row) => formatDate(row.expected_date) },
                {
                  key: "at_risk",
                  label: "Exposure",
                  render: (row) => (
                    <span className={row.at_risk ? "text-red-300" : "text-emerald-300"}>
                      {row.at_risk ? "At risk" : "Not marked at risk"}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </Panel>
      </div>
    );
  }

  function renderCopilot() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel
            title="Hybrid SQL + RAG copilot"
            subtitle="Combine live operational data with relevant indexed policy evidence."
          >
            <form onSubmit={handleHybridQuestion} className="space-y-4">
              <Field label="Selected disruption">
                <select
                  className={inputClass}
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                >
                  {incidents.map((incident) => (
                    <option key={incident.id} value={String(incident.id)}>
                      {incident.supplier} — {incident.component}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Your operational question">
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={hybridQuestion}
                  onChange={(event) => setHybridQuestion(event.target.value)}
                  placeholder="Which orders are at risk, and what recovery actions are supported by our policies?"
                />
              </Field>

              <ErrorMessage>{hybridError}</ErrorMessage>

              <Button type="submit" disabled={loadingHybrid || !selectedId}>
                {loadingHybrid ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                Ask hybrid copilot
              </Button>
            </form>
          </Panel>

          <Panel
            title="Natural-language SQL"
            subtitle="Ask a question about operational database records."
          >
            <form onSubmit={handleSqlQuestion} className="space-y-4">
              <Field label="Database question">
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={sqlQuestion}
                  onChange={(event) => setSqlQuestion(event.target.value)}
                  placeholder="Which customer orders have the largest shortages?"
                />
              </Field>

              <ErrorMessage>{sqlError}</ErrorMessage>

              <Button type="submit" disabled={loadingSql}>
                {loadingSql ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
                Ask operational database
              </Button>
            </form>
          </Panel>
        </div>

        {loadingHybrid && <LoadingState label="Combining operational records and policy evidence..." />}
        <AnswerPanel title="Hybrid copilot answer" result={hybridResult} error={hybridError} />
        {/* {hybridResult && <ResultViewer title="Complete hybrid response" result={hybridResult} />} */}

        {loadingSql && <LoadingState label="Querying operational data..." />}
        {sqlResult && <ResultViewer title="Database answer and query details" result={sqlResult} />}
      </div>
    );
  }

  function renderKnowledgeCenter() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Search indexed knowledge" subtitle="Ask questions about your uploaded policies and procedures.">
            <form onSubmit={handleKnowledgeQuestion} className="space-y-4">
              <Field label="Question">
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={knowledgeQuestion}
                  onChange={(event) => setKnowledgeQuestion(event.target.value)}
                  placeholder="What do our policies say about emergency procurement?"
                />
              </Field>

              <ErrorMessage>{knowledgeError}</ErrorMessage>

              <Button type="submit" disabled={loadingKnowledge}>
                {loadingKnowledge ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
                Search knowledge base
              </Button>
            </form>
          </Panel>

          <Panel title="Upload a knowledge document" subtitle="Index a PDF or TXT file for retrieval.">
            <form onSubmit={handleDocumentUpload} className="space-y-4">
              <Field label="Document title (optional)">
                <input
                  className={inputClass}
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="e.g. Emergency procurement policy"
                />
              </Field>

              <Field label="PDF or TXT file">
                <input
                  className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200`}
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                />
              </Field>

              {uploadFile && (
                <p className="text-xs text-slate-400">
                  Selected: {uploadFile.name}
                </p>
              )}

              <ErrorMessage>{uploadError}</ErrorMessage>
              <SuccessMessage>{uploadMessage}</SuccessMessage>

              <Button type="submit" disabled={uploadingDocument}>
                {uploadingDocument ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                Index document
              </Button>
            </form>
          </Panel>
        </div>

        {loadingKnowledge && <LoadingState label="Searching indexed documents..." />}
        <AnswerPanel title="Knowledge answer" result={knowledgeResult} error={knowledgeError} />
        {knowledgeResult && <ResultViewer title="Complete knowledge response" result={knowledgeResult} />}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-start gap-3">
            <FileText size={20} className="mt-0.5 shrink-0 text-sky-300" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Evidence matters</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                AI answers are only as reliable as the retrieved documents and underlying records.
                Check source references and verify that a policy applies to the current situation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPage() {
    switch (activeSection) {
      case "Control Tower":
        return (
          <DashboardOverview
            incidents={incidents}
            data={data}
            loading={loadingImpact}
            onNavigate={handleNavigate}
          />
        );

      case "Disruption Workspace":
        return renderDisruptionWorkspace();

      case "Suppliers":
        return renderSuppliers();

      case "Inventory":
        return renderInventory();

      case "Shipments":
        return renderShipments();

      case "AI Copilot":
        return renderCopilot();

      case "Knowledge Center":
        return renderKnowledgeCenter();

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 selection:bg-sky-400/20 md:flex md:h-screen md:overflow-hidden">
      <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <div className="mx-auto max-w-[1700px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-8">
          <header className="mb-7 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                <Activity size={14} />
                SupplyChainOS
                <span className="text-slate-600">/</span>
                {page.eyebrow}
              </div>

              {activeSection !== "Control Tower" && (
                <SectionHeader
                  eyebrow={page.eyebrow}
                  title={page.title}
                  description={page.description}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    loadingList || loadingImpact
                      ? "animate-pulse bg-amber-400"
                      : error
                        ? "bg-red-400"
                        : "bg-emerald-400"
                  }`}
                />
                <span className="text-xs text-slate-400">
                  {loadingList || loadingImpact
                    ? "Refreshing"
                    : error
                      ? "Data issue"
                      : "Connected"}
                </span>
              </div>

              <select
                aria-label="Current disruption"
                className={`${inputClass} max-w-[240px]`}
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                disabled={incidents.length === 0}
              >
                {incidents.length === 0 && <option value="">No disruptions</option>}
                {incidents.map((incident) => (
                  <option key={incident.id} value={String(incident.id)}>
                    {incident.supplier} — {incident.component}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {error && activeSection === "Control Tower" && (
            <div className="mb-5">
              <ErrorMessage>{error}</ErrorMessage>
            </div>
          )}

          {loadingList ? (
            <LoadingState label="Loading your supply network..." />
          ) : error && incidents.length === 0 ? (
            <Panel title="Unable to load the supply network">
              <ErrorMessage>{error}</ErrorMessage>
              <p className="mt-3 text-xs text-slate-500">
                Check that the backend is running and the disruptions API is reachable.
              </p>
            </Panel>
          ) : (
            renderPage()
          )}

          <footer className="mt-10 flex flex-col gap-2 border-t border-slate-800 py-5 text-[11px] leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>SupplyChainOS · Supply-chain decision intelligence</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Validate recommendations before operational commitments
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
