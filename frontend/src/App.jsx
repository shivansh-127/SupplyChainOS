import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import SectionCard from "./components/SectionCard";


const API = "http://localhost:5000/api/disruptions";

function App() {
    const [incidents, setIncidents] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [activeSection, setActiveSection] = useState("Control Tower");
    const [data, setData] = useState(null);
    
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [aiError, setAiError] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderAnalysis, setOrderAnalysis] = useState(null);

    const [loadingOrderAnalysis, setLoadingOrderAnalysis] = useState(false);
    const [orderAnalysisError, setOrderAnalysisError] = useState("");

    const orderRequestId = useRef(0);
    const aiRequestId = useRef(0);

    useEffect(() => {
        aiRequestId.current += 1;

        setAiAnalysis(null);
        setAiError("");
        setLoadingAI(false);
        setSelectedOrder(null);
        setOrderAnalysis(null);
    }, [selectedId]);



    const [loadingList, setLoadingList] = useState(true);
    const [loadingImpact, setLoadingImpact] = useState(false);
    const [error, setError] = useState("");

    const [mitigation, setMitigation] = useState(null);
    const [loadingMitigation, setLoadingMitigation] = useState(false);
    const [mitigationError, setMitigationError] = useState("");

    // RAG knowledge-question state
    const [knowledgeQuestion, setKnowledgeQuestion] = useState("");
    const [knowledgeResult, setKnowledgeResult] = useState(null);
    const [loadingKnowledge, setLoadingKnowledge] = useState(false);
    const [knowledgeError, setKnowledgeError] = useState("");

    // Load all disruptions once.
    useEffect(() => {
        let cancelled = false;

        async function loadIncidents() {
            try {
                const response = await fetch(API);

                if (!response.ok) {
                    throw new Error("Failed to load incidents.");
                }

                const result = await response.json();

                if (cancelled) return;

                setIncidents(result);

                if (result.length > 0) {
                    setSelectedId(String(result[0].id));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoadingList(false);
                }
            }
        }

        loadIncidents();

        return () => {
            cancelled = true;
        };
    }, []);

    // Load impact analysis whenever the selected disruption changes.
    useEffect(() => {
        if (!selectedId) return;

        let cancelled = false;

        async function loadImpact() {
            setLoadingImpact(true);
            setError("");

            try {
                const response = await fetch(
                    `${API}/${selectedId}/impact`
                );

                if (!response.ok) {
                    throw new Error("Failed to load incident impact.");
                }

                const result = await response.json();

                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoadingImpact(false);
                }
            }
        }

        loadImpact();

        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    // Load mitigation estimates whenever the selected disruption changes.
    useEffect(() => {
        if (!selectedId) return;

        let cancelled = false;

        async function loadMitigation() {
            setLoadingMitigation(true);
            setMitigationError("");
            setMitigation(null);

            try {
                const response = await fetch(
                    `${API}/${selectedId}/mitigation`
                );

                if (!response.ok) {
                    throw new Error("Failed to load mitigation options.");
                }

                const result = await response.json();

                if (!cancelled) {
                    setMitigation(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setMitigationError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoadingMitigation(false);
                }
            }
        }

        loadMitigation();

        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    // Formatting helpers.
    const formatNumber = (value) => {
        if (value == null || !Number.isFinite(Number(value))) {
            return "N/A";
        }

        return Number(value).toLocaleString("en-IN");
    };

    const formatDays = (value) => {
        if (value == null || !Number.isFinite(Number(value))) {
            return "N/A";
        }

        return `${Number(value).toFixed(2)} days`;
    };

    const formatCurrency = (value) => {
        if (value == null || !Number.isFinite(Number(value))) {
            return "Unknown";
        }

        return Number(value).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        });
    };

    // Navigate to the matching section inside the independently scrollable workspace.
    function handleNavigate(section) {
        const sectionIds = {
            "Control Tower": "control-tower",
            "Disruption Workspace": "disruption-workspace",
            Suppliers: "suppliers-section",
            Inventory: "inventory-section",
            Shipments: "shipments-section",
            "AI Copilot": "ai-copilot",
            "Knowledge Center": "knowledge-center",
        };

        setActiveSection(section);

        // A few operational sections are rendered only after a disruption is loaded.
        // Retry after the current render so navigation remains reliable during loading.
        const targetId = sectionIds[section];
        requestAnimationFrame(() => {
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    }

    // Initial loading screen.
    if (loadingList) {
        return (
            <div className="min-h-screen bg-black/40 p-10 text-white">
                Loading incidents...
            </div>
        );
    }
      
    
    async function handleAIInvestigation() {
        if (!selectedId) return;

        const requestId = ++aiRequestId.current;

        setLoadingAI(true);
        setAiError("");
        setAiAnalysis(null);

        try {
            const response = await fetch(
                `${API}/${selectedId}/investigate`,
                {
                    method: "POST"
                }
            );

            const result = await response.json();

            if (requestId !== aiRequestId.current) return;

            if (!response.ok) {
                throw new Error(
                    result.details ||
                    result.error ||
                    "AI investigation failed"
                );
            }

            setAiAnalysis(result.data);
        } catch (error) {
            console.error("AI investigation error:", error);
            setAiError(error.message || "Something went wrong");
        } finally {
            if (requestId === aiRequestId.current) {
            setLoadingAI(false);
        }
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
                throw new Error(
                    result.details ||
                    result.error ||
                    "Order investigation failed"
                );
            }

            // Ignore a response if a newer request has started.
            if (requestId !== orderRequestId.current) return;

            setOrderAnalysis(result.data);
        } catch (error) {
            if (requestId !== orderRequestId.current) return;

            setOrderAnalysisError(error.message);
        } finally {
            if (requestId === orderRequestId.current) {
                setLoadingOrderAnalysis(false);
            }
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
            const response = await fetch("http://localhost:5000/api/knowledge/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Knowledge question failed.");
            }

            setKnowledgeResult(result.data);
        } catch (err) {
            setKnowledgeError(
                err.message || "Unable to query the knowledge base right now."
            );
        } finally {
            setLoadingKnowledge(false);
        }
    }

    function clearOrderInvestigation() {
        orderRequestId.current += 1;
        setSelectedOrder(null);
        setOrderAnalysis(null);
        setOrderAnalysisError("");
        setLoadingOrderAnalysis(false);
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-red-500/30 md:flex md:h-screen md:overflow-hidden">
            <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />

            <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-9 md:h-screen md:overflow-y-auto">
                {/* Page header */}
                <header className="mb-8 border-b border-white/10 pb-7">
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-red-400">
                        <span className="h-2 w-2 rounded-full bg-red-500" /> SUPPLYCHAINOS / OPERATIONS
                    </p>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Incident Intelligence
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                        Investigate disruptions, assess operational impact,
                        and compare potential recovery options.
                    </p>
                </header>

                {/* Disruption registry */}
                <div id="control-tower" className="scroll-mt-8">
                <SectionCard
                    title="Disruption Registry"
                    subtitle={`${incidents.length} incidents available`}
                >
                    {incidents.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No incidents found.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {incidents.map((incident) => (
                                <button
                                    key={incident.id}
                                    onClick={() =>
                                        setSelectedId(String(incident.id))
                                    }
                                    className={`rounded-xl border p-4 text-left transition ${
                                        selectedId === String(incident.id)
                                            ? "border-red-500 bg-red-500/10"
                                            : "border-slate-700 bg-black/40 hover:border-slate-500"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-white">
                                                {incident.supplier}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                {incident.component}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-2 py-1 text-xs ${
                                                incident.status === "ACTIVE"
                                                    ? "bg-red-500/10 text-red-300"
                                                    : "bg-slate-800 text-slate-300"
                                            }`}
                                        >
                                            {incident.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                                        <span>{incident.type}</span>

                                        <span>
                                            Severity: {incident.severity}/10
                                        </span>

                                        <span>
                                            Delay: {incident.delay_days} days
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </SectionCard>
                </div>

                {/* Errors and loading states */}
                {error && (
                    <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                        {error}
                    </p>
                )}

                {loadingImpact && (
                    <div className="mt-4 flex items-center gap-3 text-sm text-red-300">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-400" />
                        Updating incident analysis...
                    </div>
                )}

                {/* Selected disruption analysis */}
                {data && (
                    <div
                        id="disruption-workspace"
                        key={selectedId}
                        className="scroll-mt-8 animate-fade-in-up"
                        aria-busy={loadingImpact}
                    >
                    <>
                    
                
                        {/* Incident overview */}
                        <section className="my-6 scroll-mt-6 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.08] via-zinc-950 to-zinc-900/70 p-5 shadow-xl shadow-black/20 sm:p-6">
                            <p className="text-sm text-slate-400">
                                ORIGIN SUPPLIER
                            </p>

                            <h2 className="mt-2 text-2xl font-bold">
                                {data.disruption.supplier}
                            </h2>

                            <p className="mt-2 text-slate-300">
                                {data.disruption.component} ·{" "}
                                {data.disruption.type}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Severity
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-red-400">
                                        {Number(
                                            data.disruption.severity
                                        ).toFixed(1)}
                                        /10
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        AI Confidence
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-red-300">
                                        {(
                                            Number(
                                                data.disruption.ai_confidence
                                            ) * 100
                                        ).toFixed(0)}
                                        %
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Delay
                                    </p>

                                    <p className="mt-1 text-2xl font-bold">
                                        {data.disruption.delay_days} days
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Expected resolution
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">
                                        {data.disruption.expected_resolution_date
                                            ? new Date(
                                                  data.disruption.expected_resolution_date
                                              ).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                                            : "Unknown"}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-5 text-sm leading-6 text-slate-300">
                                {data.disruption.description}
                            </p>
                        </section>

                        {/* Key metrics */}
                        <section id="inventory-section" className="mb-6 grid scroll-mt-6 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Component Inventory"
                                value={formatNumber(data.inventory.total)}
                                detail="Units across listed warehouses"
                                accent="cyan"
                            />

                            <StatCard
                                label="Inventory Coverage"
                                value={formatDays(
                                    data.inventory.coverageDays
                                )}
                                detail="Estimated at current daily requirement"
                                accent="amber"
                            />

                            <StatCard
                                label="Potential Supply Gap"
                                value={formatDays(data.supplyGapDays)}
                                detail="Based on delay and inventory coverage"
                                accent="red"
                            />

                            <StatCard
                                label="Affected Orders"
                                value={formatNumber(
                                    data.summary.affectedOrders
                                )}
                                detail={`${formatNumber(
                                    data.summary.totalShortage
                                )} estimated product units short`}
                                accent={
                                    data.summary.affectedOrders > 0
                                        ? "red"
                                        : "emerald"
                                }
                            />
                        </section>

                        {/* Affected factories */}
                        <div className="mb-6">
                            <SectionCard
                                title="Affected Factories"
                                subtitle="Production capacity exposed to this component disruption"
                            >
                                {(data.affectedFactories ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        No affected factories found.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-400">
                                                <tr className="border-b border-white/10">
                                                    <th className="pb-3 pr-4">
                                                        Factory
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Location
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Product
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Daily capacity
                                                    </th>
                                                    <th className="pb-3">
                                                        Production exposure
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {data.affectedFactories.map(
                                                    (factory, index) => (
                                                        <tr
                                                            key={`${factory.name}-${factory.product_id}-${index}`}
                                                            className="border-b border-white/10/70 last:border-0"
                                                        >
                                                            <td className="py-4 pr-4 font-medium">
                                                                {factory.name}
                                                            </td>

                                                            <td className="py-4 pr-4 text-slate-400">
                                                                {factory.location}
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {factory.product}
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {formatNumber(
                                                                    factory.daily_capacity
                                                                )}
                                                            </td>

                                                            <td className="py-4 text-red-300">
                                                                {formatNumber(
                                                                    factory.potential_production_loss
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Customer order impact */}
                        <div className="mb-6">
                            <SectionCard
                                title="Customer Order Impact"
                                subtitle="Estimated allocation in delivery-date order"
                            >
                                {(data.orders ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        No customer orders found.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-400">
                                                <tr className="border-b border-white/10">
                                                    <th className="pb-3 pr-4">
                                                        Order
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Product
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Ordered
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Allocated
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Shortage
                                                    </th>
                                                    <th className="pb-3">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {data.orders.map((order) => (
                                                    <tr
                                                        key={order.id}
                                                        className="border-b border-white/10/70 last:border-0"
                                                    >
                                                        <td className="py-4 pr-4">
                                                            #{order.id}
                                                        </td>

                                                        <td className="py-4 pr-4 font-medium">
                                                            {order.product}
                                                        </td>

                                                        <td className="py-4 pr-4">
                                                            {formatNumber(
                                                                order.quantity
                                                            )}
                                                        </td>

                                                        <td className="py-4 pr-4 text-white">
                                                            {formatNumber(
                                                                order.allocated
                                                            )}
                                                        </td>

                                                        <td className="py-4 pr-4 text-red-300">
                                                            {formatNumber(
                                                                order.shortage
                                                            )}
                                                        </td>

                                                        <td className="py-4">
                                                            <span
                                                                className={
                                                                    order.affected
                                                                        ? "text-red-300"
                                                                        : "text-white"
                                                                }
                                                            >
                                                                {order.affected
                                                                    ? "Shortage"
                                                                    : "Covered"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Incoming shipments */}
                        <div id="shipments-section" className="mb-6 scroll-mt-6">
                            <SectionCard
                                title="Incoming Shipments"
                                subtitle="In-transit shipments for the disrupted component"
                            >
                                {(data.incomingShipments ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        No incoming shipments found.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-400">
                                                <tr className="border-b border-white/10">
                                                    <th className="pb-3 pr-4">
                                                        Supplier
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Warehouse
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Quantity
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Expected date
                                                    </th>
                                                    <th className="pb-3">
                                                        Risk
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {data.incomingShipments.map(
                                                    (shipment) => (
                                                        <tr
                                                            key={shipment.id}
                                                            className="border-b border-white/10/70 last:border-0"
                                                        >
                                                            <td className="py-4 pr-4">
                                                                {shipment.supplier}
                                                            </td>

                                                            <td className="py-4 pr-4 text-slate-400">
                                                                {shipment.warehouse}
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {formatNumber(
                                                                    shipment.quantity
                                                                )}
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {shipment.expected_date
                                                                    ? new Date(
                                                                          shipment.expected_date
                                                                      ).toLocaleDateString(
                                                                          "en-IN"
                                                                      )
                                                                    : "Unknown"}
                                                            </td>

                                                            <td className="py-4">
                                                                <span
                                                                    className={
                                                                        shipment.at_risk
                                                                            ? "text-red-300"
                                                                            : "text-white"
                                                                    }
                                                                >
                                                                    {shipment.at_risk
                                                                        ? "At risk"
                                                                        : "Other supplier"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Configured alternative suppliers */}
                        <div id="suppliers-section" className="mb-6 scroll-mt-6">
                            <SectionCard
                                title="Alternative Suppliers"
                                subtitle="Other configured suppliers for the disrupted component, sorted by lead time and cost"
                            >
                                {(data.alternativeSuppliers ?? []).length ===
                                0 ? (
                                    <p className="text-sm text-slate-400">
                                        No alternative suppliers are configured
                                        for this component.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-400">
                                                <tr className="border-b border-white/10">
                                                    <th className="pb-3 pr-4">
                                                        Supplier
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Location
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Lead time
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Unit cost
                                                    </th>
                                                    <th className="pb-3 pr-4">
                                                        Minimum order
                                                    </th>
                                                    <th className="pb-3">
                                                        Risk score
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {data.alternativeSuppliers.map(
                                                    (supplier) => (
                                                        <tr
                                                            key={
                                                                supplier.supplier_id
                                                            }
                                                            className="border-b border-white/10/70 last:border-0"
                                                        >
                                                            <td className="py-4 pr-4 font-medium text-white">
                                                                {supplier.supplier}
                                                            </td>

                                                            <td className="py-4 pr-4 text-slate-400">
                                                                {supplier.location}
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {
                                                                    supplier.lead_time_days
                                                                }{" "}
                                                                days
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {formatCurrency(
                                                                    supplier.unit_cost
                                                                )}
                                                            </td>

                                                            <td className="py-4 pr-4">
                                                                {formatNumber(
                                                                    supplier.minimum_order_quantity
                                                                )}
                                                            </td>

                                                            <td className="py-4">
                                                                {supplier.risk_score}
                                                                /10
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Mitigation decision center */}
                        <section className="mb-6">
                            <SectionCard
                                title="Mitigation Decision Center"
                                subtitle="Compare potential recovery options using stored operational data"
                            >
                                {loadingMitigation && (
                                    <p className="text-sm text-red-300">
                                        Evaluating mitigation options...
                                    </p>
                                )}

                                {mitigationError && (
                                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                                        {mitigationError}
                                    </p>
                                )}

                                {mitigation && !loadingMitigation && (
                                    <>
                                        {/* Baseline metrics */}
                                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div className="rounded-xl bg-black/40 p-4">
                                                <p className="text-sm text-slate-400">
                                                    Inventory coverage
                                                </p>

                                                <p className="mt-2 text-2xl font-bold text-red-300">
                                                    {formatDays(
                                                        mitigation.baseline
                                                            ?.coverageDays
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-black/40 p-4">
                                                <p className="text-sm text-slate-400">
                                                    Potential supply gap
                                                </p>

                                                <p className="mt-2 text-2xl font-bold text-red-300">
                                                    {formatDays(
                                                        mitigation.baseline
                                                            ?.supplyGapDays
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-black/40 p-4">
                                                <p className="text-sm text-slate-400">
                                                    Original unit cost
                                                </p>

                                                <p className="mt-2 text-2xl font-bold text-white">
                                                    {formatCurrency(
                                                        mitigation.baseline
                                                            ?.originalUnitCost
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Procurement comparison */}
                                        <h3 className="mb-3 font-semibold text-white">
                                            Emergency Procurement Alternatives
                                        </h3>

                                        {(
                                            mitigation.options
                                                ?.emergencyProcurement ?? []
                                        ).length === 0 ? (
                                            <p className="text-sm text-slate-400">
                                                No alternative suppliers are
                                                configured for emergency
                                                procurement.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="text-slate-400">
                                                        <tr className="border-b border-white/10">
                                                            <th className="pb-3 pr-4">
                                                                Supplier
                                                            </th>
                                                            <th className="pb-3 pr-4">
                                                                Lead time
                                                            </th>
                                                            <th className="pb-3 pr-4">
                                                                Estimated quantity
                                                            </th>
                                                            <th className="pb-3 pr-4">
                                                                Estimated cost
                                                            </th>
                                                            <th className="pb-3 pr-4">
                                                                Cost premium
                                                            </th>
                                                            <th className="pb-3">
                                                                Arrival assessment
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {mitigation.options.emergencyProcurement.map(
                                                            (option) => (
                                                                <tr
                                                                    key={
                                                                        option.supplierId
                                                                    }
                                                                    className="border-b border-white/10/70 last:border-0"
                                                                >
                                                                    <td className="py-4 pr-4 font-medium text-white">
                                                                        {
                                                                            option.supplier
                                                                        }
                                                                    </td>

                                                                    <td className="py-4 pr-4">
                                                                        {
                                                                            option.leadTimeDays
                                                                        }{" "}
                                                                        days
                                                                    </td>

                                                                    <td className="py-4 pr-4">
                                                                        {formatNumber(
                                                                            option.estimatedOrderQuantity
                                                                        )}
                                                                    </td>

                                                                    <td className="py-4 pr-4 text-red-300">
                                                                        {formatCurrency(
                                                                            option.estimatedProcurementCost
                                                                        )}
                                                                    </td>

                                                                    <td className="py-4 pr-4">
                                                                        {formatCurrency(
                                                                            option.estimatedCostPremium
                                                                        )}
                                                                    </td>

                                                                   
                                                                    <td className="py-4">
                                                                        <span
                                                                            className={
                                                                                option.timingAssessment === "ARRIVES_BEFORE_STOCKOUT"
                                                                                    ? "text-white"
                                                                                    : option.timingAssessment === "UNKNOWN_INVENTORY_COVERAGE"
                                                                                    ? "text-slate-400"
                                                                                    : "text-red-300"
                                                                            }
                                                                        >
                                                                            {option.timingAssessment === "ARRIVES_BEFORE_STOCKOUT"
                                                                                ? "Before stockout"
                                                                                : option.timingAssessment === "ARRIVES_AFTER_STOCKOUT"
                                                                                ? "After stockout"
                                                                                : option.timingAssessment === "ARRIVES_AFTER_EXPECTED_RECOVERY"
                                                                                    ? "After recovery"
                                                                                    : "Coverage unknown"}
                                                                        </span>

                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            {option.estimatedOrderQuantity === 0
                                                                                ? "No quantity estimated for current disruption window"
                                                                                : `Estimated order: ${Number(
                                                                                    option.estimatedOrderQuantity
                                                                                ).toLocaleString("en-IN")} units`}
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            Supplier availability unconfirmed
                                                                        </p>
                                                                    </td>

                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Other recovery options */}
                                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                                                <h4 className="font-semibold text-white">
                                                    Wait for Original Supplier
                                                </h4>

                                                <p className="mt-2 text-sm text-slate-400">
                                                    Estimated supply gap:{" "}
                                                    {formatDays(
                                                        mitigation.options
                                                            ?.waitForOriginalSupplier
                                                            ?.estimatedSupplyGapDays
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                                                <h4 className="font-semibold text-white">
                                                    Adjust Production
                                                </h4>

                                                <p className="mt-2 text-sm text-slate-400">
                                                    {mitigation.options
                                                        ?.adjustProduction
                                                        ?.status ??
                                                        "NOT_CALCULATED"}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Production rescheduling
                                                    estimates are not yet
                                                    implemented.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Decision disclaimer */}
                                        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                                            <p className="font-semibold text-red-200">
                                                Decision support, not a confirmed
                                                procurement plan
                                            </p>

                                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                                Costs, quantities and arrival
                                                assessments are estimates.
                                                Supplier capacity, actual
                                                availability, warehouse
                                                constraints, incoming shipment
                                                timing and delivery uncertainty
                                                are not fully modeled. Verify
                                                these details before committing
                                                to an order.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </SectionCard>
                        </section>
                         
                        <div id="ai-copilot" className="mb-6 scroll-mt-6 rounded-2xl border border-red-500/30 bg-zinc-950 p-5">
                        <h2 className="mb-3 text-xl font-bold text-white">AI Decision Copilot</h2>
                        <p className="mb-4 text-sm text-slate-400">Investigate the selected disruption using operational impact evidence.</p>
                        <button
                            onClick={handleAIInvestigation}
                            disabled={loadingAI || !selectedId}
                            className="rounded-lg bg-red-600 px-4 py-2 text-white
                                    hover:bg-red-500 disabled:cursor-not-allowed
                                    disabled:opacity-50"
                        >
                            {loadingAI ? "Investigating..." : "Investigate with AI"}
                        </button>
                        
                        {aiError && (
                            <p className="mt-3 text-sm text-red-600">
                                {aiError}
                            </p>
                        )}

                        {aiAnalysis && (
                            <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                                <h2 className="text-xl font-bold">
                                    AI Disruption Investigation
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Category: {aiAnalysis.eventCategory}
                                </p>

                                
                                <p className="mt-2 text-sm text-slate-500">
                                    Supplier: {aiAnalysis.trustedFacts?.supplierName ?? "Unknown"}
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Component: {aiAnalysis.trustedFacts?.componentName ?? "Unknown"}
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Database-recorded resolution date:{" "}
                                    {aiAnalysis.trustedFacts?.expectedResolutionDate
                                        ? new Date(
                                            aiAnalysis.trustedFacts.expectedResolutionDate
                                        ).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            timeZone: "Asia/Kolkata"
                                        })
                                        : "Not recorded"}
                                </p>


                                <p className="mt-2">
                                    <strong>AI-assessed severity:</strong>{" "}
                                    {aiAnalysis.assessedSeverity}/10
                                </p>

                                <p className="mt-3">{aiAnalysis.summary}</p>

                                <h3 className="mt-4 font-semibold">Reasoning</h3>
                                <p>{aiAnalysis.reasoning}</p>

                                <h3 className="mt-4 font-semibold">Key risks</h3>
                                <ul className="list-disc pl-5">
                                    {aiAnalysis.keyRisks.map((risk, index) => (
                                        <li key={index}>{risk}</li>
                                    ))}
                                </ul>

                                <h3 className="mt-4 font-semibold">
                                    Recommended next steps
                                </h3>
                                <ul className="list-disc pl-5">
                                    {aiAnalysis.recommendedNextSteps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ul>

                                <h3 className="mt-4 font-semibold">Uncertainties</h3>
                                <ul className="list-disc pl-5">
                                    {aiAnalysis.uncertainties.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>

                                <p className="mt-4 text-xs text-slate-500">
                                    Model-reported confidence:{" "}
                                    {(aiAnalysis.confidence * 100).toFixed(0)}%
                                    {" · "}AI-generated assessment; verify important facts.
                                </p>
                            </section>
                        )}
                        </div>
                      
                        {data && (
                            <section className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                                <h2 className="text-xl font-bold">
                                    Operational Impact Evidence
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Calculated by the SupplyChainOS impact engine
                                </p>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-lg bg-slate-800 p-4">
                                        <p className="text-sm text-slate-300">
                                            Available inventory
                                        </p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {Number(data.inventory.total).toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-xs text-slate-400">Units</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-800 p-4">
                                        <p className="text-sm text-slate-300">
                                            Daily requirement
                                        </p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {Number(data.inventory.dailyRequirement).toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-xs text-slate-400">Units per day</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-800 p-4">
                                        <p className="text-sm text-slate-300">
                                            Inventory coverage
                                        </p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {Number(data.inventory.coverageDays).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-400">Days</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-800 p-4">
                                        <p className="text-sm text-slate-300">
                                            Total order shortage
                                        </p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {Number(data.summary.totalShortage).toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-xs text-slate-400">Units</p>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <h3 className="font-semibold">Affected customer orders</h3>

                                    <div className="mt-2 overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-700">
                                                    <th className="p-2">Order ID</th>
                                                    <th className="p-2">Product</th>
                                                    <th className="p-2">Ordered</th>
                                                    <th className="p-2">Allocated</th>
                                                    <th className="p-2">Shortage</th>
                                                    <th className="p-2">Action</th>
                                                </tr>
                                            </thead>

                                            
                                            <tbody>
                                                {data.orders
                                                    .filter(order => order.affected)
                                                    .map(order => (
                                                        <tr
                                                            key={order.id}
                                                            onClick={() => {
                                                                if (selectedOrder?.id !== order.id) {
                                                                    orderRequestId.current += 1;
                                                                    setSelectedOrder(order);
                                                                    setOrderAnalysis(null);
                                                                    setOrderAnalysisError("");
                                                                    setLoadingOrderAnalysis(false);
                                                                }
                                                            }}
                                                            className={`border-b border-white/10 cursor-pointer ${
                                                                selectedOrder?.id === order.id
                                                                    ? "bg-red-500/10"
                                                                    : "hover:bg-slate-800/50"
                                                            }`}
                                                        >
                                                            <td className="p-2">{order.id}</td>
                                                            <td className="p-2">{order.product}</td>
                                                            <td className="p-2">
                                                                {Number(order.quantity).toLocaleString("en-IN")}
                                                            </td>
                                                            <td className="p-2">
                                                                {Number(order.allocated).toLocaleString("en-IN")}
                                                            </td>
                                                            <td className="p-2 font-semibold text-red-400">
                                                                {Number(order.shortage).toLocaleString("en-IN")}
                                                            </td>
                                                            <td className="p-2 text-red-400">
                                                                {selectedOrder?.id === order.id
                                                                    ? "Selected"
                                                                    : "Investigate →"}
                                                            </td>
                                                        </tr>
                                                    ))}

                                                {data.orders.filter(order => order.affected).length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="p-2 text-slate-400">
                                                            No customer orders are currently marked as affected.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>

                                        </table>
                                        
                                        {selectedOrder && (
                                            <div className="mt-5 rounded-xl border border-slate-700 p-5">
                                                <h3 className="text-lg font-semibold">
                                                    AI Order Investigation
                                                </h3>

                                                <p className="mt-2 text-sm text-slate-400">
                                                    Order #{selectedOrder.id} · {selectedOrder.product}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    Shortage: {Number(selectedOrder.shortage).toLocaleString("en-IN")} units
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={handleOrderInvestigation}
                                                    disabled={loadingOrderAnalysis}
                                                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white
                                                            hover:bg-red-500 disabled:cursor-not-allowed
                                                            disabled:opacity-60"
                                                >
                                                    {loadingOrderAnalysis
                                                        ? "Investigating..."
                                                        : "Explain this order with AI"}
                                                </button>

                                                {orderAnalysisError && (
                                                    <p className="mt-3 text-sm text-red-400" role="alert">
                                                        {orderAnalysisError}
                                                    </p>
                                                )}

                                                {orderAnalysis && (
                                                    <div className="mt-5 space-y-5">
                                                        <section>
                                                            <h4 className="font-semibold">Explanation</h4>
                                                            <p className="mt-2 text-slate-300">
                                                                {orderAnalysis.explanation}
                                                            </p>
                                                        </section>

                                                        <section>
                                                            <h4 className="font-semibold">Evidence</h4>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                                                                {orderAnalysis.evidence.map((item, index) => (
                                                                    <li key={index}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </section>

                                                        <section>
                                                            <h4 className="font-semibold">Recommended actions</h4>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                                                                {orderAnalysis.recommendedActions.map((item, index) => (
                                                                    <li key={index}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </section>

                                                        <section>
                                                            <h4 className="font-semibold">Uncertainties</h4>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                                                                {orderAnalysis.uncertainties.map((item, index) => (
                                                                    <li key={index}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </section>

                                                        <p className="text-xs text-slate-500">
                                                            AI-generated decision support. Verify operational facts
                                                            before acting on recommendations.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </section>
                        )}


                        {/* Planned AI investigation module
                        <section className="mb-6">
                            <SectionCard
                                title="AI Investigation"
                                subtitle="Evidence retrieval and analysis"
                            >
                                <p className="text-sm leading-6 text-slate-400">
                                    Supplier contracts, procurement policies,
                                    incident reports and external evidence will
                                    appear here when the investigation pipeline
                                    is implemented.
                                </p>

                                <p className="mt-4 text-xs text-red-300">
                                    Planned module · Not implemented yet
                                </p>
                            </SectionCard>
                        </section> */}
                        </>
                        </div>
                )}

                <section id="knowledge-center" className="mt-8 scroll-mt-6 rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-red-400">RAG · QDRANT + GEMINI</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Knowledge Center</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        Ask questions about indexed supplier policies and procedures. Answers are generated using retrieved document evidence, with source references shown below.
                    </p>

                    <form onSubmit={handleKnowledgeQuestion} className="mt-5 space-y-3">
                        <label htmlFor="knowledge-question" className="block text-sm font-medium text-slate-200">
                            Ask the knowledge base
                        </label>
                        <textarea
                            id="knowledge-question"
                            value={knowledgeQuestion}
                            onChange={(event) => setKnowledgeQuestion(event.target.value)}
                            placeholder="Example: What should we do when a critical supplier delays delivery?"
                            rows={3}
                            className="w-full rounded-xl border border-slate-700 bg-black/40 p-3 text-sm text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                            disabled={loadingKnowledge}
                        />
                        <button
                            type="submit"
                            disabled={loadingKnowledge || !knowledgeQuestion.trim()}
                            className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loadingKnowledge ? "Searching knowledge base..." : "Ask AI Copilot"}
                        </button>
                    </form>

                    {knowledgeError && (
                        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
                            {knowledgeError}
                        </p>
                    )}

                    {knowledgeResult && (
                        <div className="mt-6 space-y-4">
                            <section className="rounded-xl border border-slate-700 bg-black/40 p-5">
                                <h3 className="font-semibold text-white">Answer</h3>
                                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                                    {knowledgeResult.answer}
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-700 p-5">
                                <h3 className="font-semibold text-white">Retrieved sources</h3>
                                {knowledgeResult.sources?.length ? (
                                    <div className="mt-3 space-y-3">
                                        {knowledgeResult.sources.map((source, index) => (
                                            <div key={`${source.source}-${source.chunkIndex}-${index}`} className="rounded-lg bg-black/40 p-3">
                                                <p className="text-sm font-medium text-red-300">
                                                    {source.citation || `[Source ${index + 1}]`} · {source.title || "Untitled document"}
                                                </p>
                                                <p className="mt-1 break-all text-xs text-slate-400">{source.source}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Chunk {source.chunkIndex ?? "N/A"} · Similarity score: {typeof source.score === "number" ? source.score.toFixed(3) : "N/A"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-400">No sources were returned.</p>
                                )}
                                <p className="mt-4 text-xs leading-5 text-red-300">
                                    AI-generated decision support. Similarity scores are not confidence percentages; verify important operational decisions against the original documents.
                                </p>
                            </section>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default App;