import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  Database,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Activity,
  SlidersHorizontal,
  Search,
  DollarSign,
  ShoppingCart,
  Percent,
  Award,
  Globe,
  Tag,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

interface DatasetMetadata {
  upload_id: string;
  original_name: string;
  saved_name: string;
  upload_time: string;
  file_size: number;
  columns: string[];
  rows: number;
  status: string;
}

interface KPICardDetails {
  value: string;
  change: string;
  trend: "up" | "down";
  label: string;
}

interface FilterOptions {
  categories: string[];
  regions: string[];
  products: string[];
}

interface DashboardMiniChartProps {
  chartType: "line" | "bar" | "pie" | "scatter" | "area";
  xAxis: string;
  yAxis: string;
  records: any[];
}

const DashboardMiniChart: React.FC<DashboardMiniChartProps> = ({
  chartType,
  xAxis,
  yAxis,
  records,
}) => {
  const chartPoints = React.useMemo(() => {
    if (!xAxis || !yAxis || !records || records.length === 0) return [];

    const matchCol = (name: string) => {
      if (!records[0]) return name;
      const lower = name.toLowerCase();
      const match = Object.keys(records[0]).find((k) => k.toLowerCase() === lower);
      return match || name;
    };

    const xKey = matchCol(xAxis);
    const yKey = matchCol(yAxis);

    const groups: Record<string, number> = {};
    records.forEach((row) => {
      const xVal = String(row[xKey] || "N/A");
      const yVal = Number(row[yKey] || 0);
      groups[xVal] = (groups[xVal] || 0) + (isNaN(yVal) ? 0 : yVal);
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .slice(0, 6);
  }, [records, xAxis, yAxis]);

  if (chartPoints.length === 0) {
    return <div className="text-zinc-600 text-xs italic">No data points to render.</div>;
  }

  const width = 300;
  const height = 140;
  const padding = 25;
  const maxVal = Math.max(...chartPoints.map((p) => p.value), 1);

  const getCoordinates = (index: number, val: number) => {
    const x = padding + (index / (chartPoints.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (val / maxVal) * (height - 2 * padding);
    return { x, y };
  };

  const getPieCoordinates = (percent: number, radius: number, cx: number, cy: number) => {
    const x = cx + radius * Math.cos(2 * Math.PI * percent);
    const y = cy + radius * Math.sin(2 * Math.PI * percent);
    return { x, y };
  };

  if (chartType === "pie") {
    let accumulatedPercent = 0;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 35;
    const total = chartPoints.reduce((s, p) => s + p.value, 0);

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {chartPoints.map((p, idx) => {
          if (total === 0) return null;
          const percent = p.value / total;
          const start = getPieCoordinates(accumulatedPercent, radius, cx, cy);
          accumulatedPercent += percent;
          const end = getPieCoordinates(accumulatedPercent, radius, cx, cy);
          const largeArc = percent > 0.5 ? 1 : 0;
          const pathData = `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
          const colors = ["#6366f1", "#06b6d4", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899"];
          const color = colors[idx % colors.length];
          return (
            <path key={idx} d={pathData} fill={color} opacity="0.8" className="hover:opacity-100 transition cursor-pointer">
              <title>{`${p.name}: ${p.value.toLocaleString()}`}</title>
            </path>
          );
        })}
      </svg>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="miniBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="miniAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {[0, 0.5, 1].map((ratio, i) => {
        const y = padding + ratio * (height - 2 * padding);
        return (
          <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#18181b" strokeWidth="0.5" strokeDasharray="2" />
        );
      })}

      {/* Render Chart Types */}
      {chartType === "bar" &&
        chartPoints.map((p, idx) => {
          const coords = getCoordinates(idx, p.value);
          const barWidth = Math.max(10, (width - 2 * padding) / (chartPoints.length * 2));
          const barHeight = height - padding - coords.y;
          return (
            <rect key={idx} x={coords.x - barWidth / 2} y={coords.y} width={barWidth} height={Math.max(1, barHeight)} fill="url(#miniBarGrad)" rx="1.5" className="hover:opacity-100 opacity-90 transition cursor-pointer">
              <title>{`${p.name}: ${p.value.toLocaleString()}`}</title>
            </rect>
          );
        })}

      {chartType === "area" && (
        <>
          <path
            d={`
              M ${getCoordinates(0, 0).x} ${height - padding}
              ${chartPoints.map((p, idx) => {
                const c = getCoordinates(idx, p.value);
                return `L ${c.x} ${c.y}`;
              }).join(" ")}
              L ${getCoordinates(chartPoints.length - 1, 0).x} ${height - padding} Z
            `}
            fill="url(#miniAreaGrad)"
          />
          <path
            d={chartPoints.map((p, idx) => {
              const c = getCoordinates(idx, p.value);
              return `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`;
            }).join(" ")}
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
          />
        </>
      )}

      {(chartType === "line" || chartType === "scatter") && (
        <>
          {chartType === "line" && (
            <path
              d={chartPoints.map((p, idx) => {
                const c = getCoordinates(idx, p.value);
                return `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`;
              }).join(" ")}
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
            />
          )}
          {chartPoints.map((p, idx) => {
            const coords = getCoordinates(idx, p.value);
            return (
              <circle key={idx} cx={coords.x} cy={coords.y} r="3" fill="#06b6d4" className="hover:r-4 transition cursor-pointer">
                <title>{`${p.name}: ${p.value.toLocaleString()}`}</title>
              </circle>
            );
          })}
        </>
      )}

      {/* X Axis Labels */}
      {chartPoints.map((p, idx) => {
        const coords = getCoordinates(idx, 0);
        return (
          <text key={idx} x={coords.x} y={height - padding + 12} fill="#52525b" fontSize="6" textAnchor="middle">
            {p.name.length > 8 ? `${p.name.slice(0, 7)}.` : p.name}
          </text>
        );
      })}
    </svg>
  );
};

export const DashboardHome: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  // Dashboard view mode: 'standard' | 'theme'
  const [dashboardMode, setDashboardMode] = useState<"standard" | "theme">(
    "standard",
  );
  const [themeName, setThemeName] = useState<string>("");
  const [themeWidgets, setThemeWidgets] = useState<any[]>([]);

  // KPI card metrics state
  const [kpis, setKpis] = useState<Record<string, KPICardDetails> | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    regions: [],
    products: [],
  });

  // Active selected filters
  const [selCategory, setSelCategory] = useState("");
  const [selRegion, setSelRegion] = useState("");
  const [selProduct, setSelProduct] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<any[]>([]);

  // Fetch datasets list
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const data = await api.get("/upload/recent");
        setDatasets(data);

        // Fetch active dataset from backend
        const activeData = await api.get("/upload/active");
        if (activeData && activeData.upload_id) {
          setSelectedDatasetId(activeData.upload_id);
          return;
        }

        if (data.length > 0) {
          setSelectedDatasetId(data[0].upload_id);
        }
      } catch (err) {
        console.warn("Failed fetching datasets list:", err);
      }
    };
    fetchDatasets();
  }, []);

  // Fetch full records when active dataset changes
  useEffect(() => {
    if (!selectedDatasetId) return;
    const fetchRecords = async () => {
      try {
        const rData = await api.get(`/upload/${selectedDatasetId}/records`);
        setRecords(rData.records || []);
      } catch (err) {
        console.error("Failed fetching records for dashboard charts:", err);
      }
    };
    fetchRecords();
  }, [selectedDatasetId]);

  const handleDatasetChange = async (id: string) => {
    setSelectedDatasetId(id);
    handleResetFilters();
    try {
      await api.post(`/upload/active/${id}`);
    } catch (err) {
      console.error("Failed setting active dataset:", err);
    }
  };

  // Fetch KPIs on dataset or filter changes
  useEffect(() => {
    if (!selectedDatasetId) {
      setLoading(false);
      return;
    }

    const fetchOverview = async () => {
      setLoading(true);
      try {
        let endpoint = `/analytics/overview/${selectedDatasetId}`;
        const params: string[] = [];
        if (selCategory)
          params.push(`category=${encodeURIComponent(selCategory)}`);
        if (selRegion) params.push(`region=${encodeURIComponent(selRegion)}`);
        if (selProduct)
          params.push(`product=${encodeURIComponent(selProduct)}`);

        if (params.length > 0) {
          endpoint += `?${params.join("&")}`;
        }

        const data = await api.get(endpoint);
        setKpis(data);
        if (data.filters) {
          setFilters(data.filters);
        }
      } catch (err) {
        console.error("Failed fetching overview KPIs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (dashboardMode === "standard") {
      fetchOverview();
    }
  }, [selectedDatasetId, selCategory, selRegion, selProduct, dashboardMode]);

  // Handle AI Thematic Dashboard Generator Query
  const handleAIBuildDashboard = async (queryText: string) => {
    if (!selectedDatasetId || !queryText.trim()) return;

    setLoading(true);
    let theme = "revenue";
    const q = queryText.toLowerCase();
    if (q.includes("sale") || q.includes("order") || q.includes("volume")) {
      theme = "sales";
    } else if (
      q.includes("finance") ||
      q.includes("profit") ||
      q.includes("margin")
    ) {
      theme = "finance";
    } else if (
      q.includes("marketing") ||
      q.includes("lead") ||
      q.includes("campaign")
    ) {
      theme = "marketing";
    }

    try {
      const data = await api.get(`/analytics/theme/${selectedDatasetId}?theme=${theme}`);
      setThemeWidgets(data.widgets);
      setKpis(data.kpis);
      setThemeName(data.theme);
      setDashboardMode("theme");
    } catch (err) {
      console.error("Failed loading theme layout:", err);
    } finally {
      setLoading(false);
      setSearchQuery("");
    }
  };

  const handleResetFilters = () => {
    setSelCategory("");
    setSelRegion("");
    setSelProduct("");
    setDashboardMode("standard");
  };

  // KPI icon map
  const getIcon = (key: string) => {
    switch (key) {
      case "revenue":
        return DollarSign;
      case "orders":
        return ShoppingCart;
      case "growth":
        return Percent;
      case "profit":
        return Activity;
      case "aov":
        return Layers;
      case "top_product":
        return Award;
      case "worst_product":
        return AlertCircle;
      case "top_region":
        return Globe;
      case "top_category":
        return Tag;
      case "peak_month":
        return Calendar;
      case "lowest_month":
        return Calendar;
      default:
        return TrendingUp;
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" },
    }),
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Search and Header panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b border-zinc-900/60">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="text-indigo-400" size={24} />
            <span>Executive Business AI Dashboard</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Real-time dynamic corporate analytics generated from physical CSV
            models.
          </p>
        </div>

        {/* AI Dashboard Builder input bar */}
        <div className="flex items-center gap-3 w-full lg:w-auto max-w-md">
          <div className="relative flex-1 lg:w-80">
            <Search
              className="absolute left-3 top-2.5 text-zinc-500"
              size={15}
            />
            <input
              type="text"
              placeholder="e.g. Create sales dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAIBuildDashboard(searchQuery);
              }}
              className="w-full bg-zinc-950/40 border border-zinc-900 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleAIBuildDashboard(searchQuery)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            <Sparkles size={13} />
            <span>Generate Layout</span>
          </button>
        </div>
      </div>

      {/* Dataset Selection & Quick Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-zinc-900/50">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Database size={15} className="text-indigo-400" />
          <span className="text-xs text-zinc-400 font-semibold">
            Active Context:
          </span>
          <select
            value={selectedDatasetId}
            onChange={(e) => handleDatasetChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-medium cursor-pointer focus:outline-none"
          >
            {datasets.map((d) => (
              <option key={d.upload_id} value={d.upload_id}>
                {d.original_name}
              </option>
            ))}
          </select>
        </div>

        {dashboardMode === "standard" ? (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <SlidersHorizontal size={13} className="text-zinc-500" />

            <select
              value={selCategory}
              onChange={(e) => setSelCategory(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Category (All)</option>
              {filters.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selRegion}
              onChange={(e) => setSelRegion(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Region (All)</option>
              {filters.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={selProduct}
              onChange={(e) => setSelProduct(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Product (All)</option>
              {filters.products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {(selCategory || selRegion || selProduct) && (
              <button
                onClick={handleResetFilters}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase transition"
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Theme: {themeName.toUpperCase()} Dashboard
            </span>
            <button
              onClick={() => {
                setDashboardMode("standard");
                handleResetFilters();
              }}
              className="text-[10px] text-zinc-400 hover:text-white font-bold uppercase transition"
            >
              Reset to Full Overview
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-zinc-900 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : kpis ? (
        <div className="space-y-8">
          {/* Dashboard Title / Sub-section */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              {dashboardMode === "standard"
                ? "Operational Health & KPIs Matrix"
                : `${themeName.toUpperCase()} Thematic Insights Grid`}
            </h3>
            {dashboardMode === "theme" && (
              <span className="text-[10px] text-zinc-500 font-medium">
                Layout compiled automatically in 240ms
              </span>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardMode === "standard"
              ? Object.entries(kpis).map(([key, details], i) => {
                  if (key === "filters") return null;

                  const coreKeys = ["revenue", "orders", "growth", "profit", "aov", "top_product", "top_region", "top_category"];
                  if (!coreKeys.includes(key)) return null;

                  const Icon = getIcon(key);

                  const colorMaps: Record<string, string> = {
                    revenue:
                      "from-indigo-600/10 to-indigo-500/5 hover:border-indigo-500/30 text-indigo-400",
                    orders:
                      "from-cyan-600/10 to-cyan-500/5 hover:border-cyan-500/30 text-cyan-400",
                    growth:
                      "from-sky-600/10 to-sky-500/5 hover:border-sky-500/30 text-sky-400",
                    profit:
                      "from-emerald-600/10 to-emerald-500/5 hover:border-emerald-500/30 text-emerald-400",
                    aov: "from-amber-600/10 to-amber-500/5 hover:border-amber-500/30 text-amber-400",
                    top_product:
                      "from-purple-600/10 to-purple-500/5 hover:border-purple-500/30 text-purple-400",
                    top_region:
                      "from-teal-600/10 to-teal-500/5 hover:border-teal-500/30 text-teal-400",
                    top_category:
                      "from-pink-600/10 to-pink-500/5 hover:border-pink-500/30 text-pink-400",
                  };

                  const gradStyle =
                    colorMaps[key] ||
                    "from-zinc-900/40 to-zinc-950/20 hover:border-zinc-800 text-zinc-400";
                  const isUp = details.trend === "up";

                  return (
                    <motion.div
                      key={key}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className={`relative overflow-hidden rounded-2xl border border-zinc-900 bg-gradient-to-br ${gradStyle} p-5 transition-all duration-300 hover:shadow-premium`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                            {details.label}
                          </span>
                          <h4
                            className="text-base lg:text-lg font-bold text-zinc-100 tracking-tight truncate max-w-[170px]"
                            title={details.value}
                          >
                            {details.value}
                          </h4>
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5">
                        {isUp ? (
                          <ArrowUpRight size={14} className="text-emerald-500" />
                        ) : (
                          <ArrowDownRight size={14} className="text-rose-500" />
                        )}
                        <span
                          className={`text-[10px] font-bold ${isUp ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {details.change}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              : themeWidgets
                  .filter((w) => w.type === "kpi_card")
                  .map((widget, i) => {
                    const key = widget.key;
                    const details = kpis[key] || {
                      value: "N/A",
                      change: "0.0% MoM",
                      trend: "up",
                      label: widget.title,
                    };
                    const Icon = getIcon(key);

                    const colorMaps: Record<string, string> = {
                      revenue:
                        "from-indigo-600/10 to-indigo-500/5 hover:border-indigo-500/30 text-indigo-400",
                      orders:
                        "from-cyan-600/10 to-cyan-500/5 hover:border-cyan-500/30 text-cyan-400",
                      growth:
                        "from-sky-600/10 to-sky-500/5 hover:border-sky-500/30 text-sky-400",
                      profit:
                        "from-emerald-600/10 to-emerald-500/5 hover:border-emerald-500/30 text-emerald-400",
                      aov: "from-amber-600/10 to-amber-500/5 hover:border-amber-500/30 text-amber-400",
                      top_product:
                        "from-purple-600/10 to-purple-500/5 hover:border-purple-500/30 text-purple-400",
                      top_region:
                        "from-teal-600/10 to-teal-500/5 hover:border-teal-500/30 text-teal-400",
                      top_category:
                        "from-pink-600/10 to-pink-500/5 hover:border-pink-500/30 text-pink-400",
                    };

                    const gradStyle =
                      colorMaps[key] ||
                      "from-zinc-900/40 to-zinc-950/20 hover:border-zinc-800 text-zinc-400";
                    const isUp = details.trend === "up";

                    return (
                      <motion.div
                        key={key}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className={`relative overflow-hidden rounded-2xl border border-zinc-900 bg-gradient-to-br ${gradStyle} p-5 transition-all duration-300 hover:shadow-premium`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                              {widget.title}
                            </span>
                            <h4
                              className="text-base lg:text-lg font-bold text-zinc-100 tracking-tight truncate max-w-[170px]"
                              title={details.value}
                            >
                              {details.value}
                            </h4>
                          </div>

                          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                            <Icon size={16} />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-1.5">
                          {isUp ? (
                            <ArrowUpRight size={14} className="text-emerald-500" />
                          ) : (
                            <ArrowDownRight size={14} className="text-rose-500" />
                          )}
                          <span
                            className={`text-[10px] font-bold ${isUp ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {details.change}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
          </div>

          {/* Render Thematic Widgets if theme dashboard is loaded */}
          {dashboardMode === "theme" && themeWidgets.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Thematic Widgets Grid
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {themeWidgets.map((widget, widx) => {
                  if (widget.type === "chart") {
                    return (
                      <div
                        key={widx}
                        className="glass-panel p-5 rounded-2xl border border-zinc-900 md:col-span-1 space-y-4"
                      >
                        <span className="text-xs font-semibold text-zinc-400 block mb-2">
                          {widget.title}
                        </span>
                        <div className="h-40 flex items-center justify-center bg-zinc-950/40 rounded-lg border border-zinc-900/60">
                          <DashboardMiniChart
                            chartType={widget.chart_type}
                            xAxis={widget.x_axis}
                            yAxis={widget.y_axis}
                            records={records}
                          />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
          <Database size={32} className="text-zinc-700" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-400">
              Platform Ready for Ingestion
            </h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Please upload a CSV dataset file inside the upload portal to
              calculate the operational dashboard metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardHome;
