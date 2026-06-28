import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Info,
  FileSpreadsheet,
} from "lucide-react";

interface DatasetMetadata {
  upload_id: string;
  original_name: string;
}

export const AnalyticsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  // KPI Metrics
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Explorer states
  const [records, setRecords] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [dtypes, setDtypes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Statistics
  const [selectedStatColumn, setSelectedStatColumn] = useState<string>("");
  const [columnStat, setColumnStat] = useState<any>(null);

  // Initial datasets fetch
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch(
          "http://https://smart-csv-data-analyst-api.onrender.com/api/upload/recent",
        );
        if (res.ok) {
          const data = await res.json();
          setDatasets(data);

          // Fetch active dataset from backend
          const activeRes = await fetch(
            "http://https://smart-csv-data-analyst-api.onrender.com/api/upload/active",
          );
          if (activeRes.ok) {
            const activeData = await activeRes.json();
            if (activeData && activeData.upload_id) {
              setSelectedDatasetId(activeData.upload_id);
              return;
            }
          }

          if (data.length > 0) {
            setSelectedDatasetId(data[0].upload_id);
          }
        }
      } catch (err) {
        console.warn("Failed fetching datasets list", err);
      }
    };
    fetchDatasets();
  }, []);

  const handleDatasetChange = async (id: string) => {
    setSelectedDatasetId(id);
    try {
      await fetch(
        `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/active/${id}`,
        { method: "POST" },
      );
    } catch (err) {
      console.error("Failed setting active dataset:", err);
    }
  };

  // Fetch KPI cards & full records on select
  useEffect(() => {
    if (!selectedDatasetId) {
      setLoading(false);
      return;
    }

    const fetchAnalysisData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Dynamic KPIs
        const kpiRes = await fetch(
          `http://https://smart-csv-data-analyst-api.onrender.com/api/analytics/overview/${selectedDatasetId}`,
        );
        const healthRes = await fetch(
          `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/${selectedDatasetId}/health`,
        );

        let kpiData = {};
        if (kpiRes.ok) {
          kpiData = await kpiRes.json();
        }

        let healthData = {};
        if (healthRes.ok) {
          healthData = await healthRes.json();
        }

        // Merge KPIs
        setKpis({
          ...kpiData,
          health: healthData,
        });

        // 2. Fetch Full Records for Explorer
        const recRes = await fetch(
          `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/${selectedDatasetId}/records`,
        );
        if (recRes.ok) {
          const rData = await recRes.json();
          setColumns(rData.columns);
          setDtypes(rData.data_types);
          setRecords(rData.records);
          if (rData.columns.length > 0) {
            setSelectedStatColumn(rData.columns[0]);
          }
        }
      } catch (err) {
        console.error("Failed fetching analysis data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [selectedDatasetId]);

  // Compute stats on target column select
  useEffect(() => {
    if (!selectedStatColumn || records.length === 0) return;

    const values = records
      .map((r) => r[selectedStatColumn])
      .filter((v) => v !== null && v !== undefined && v !== "");

    const isNumeric =
      dtypes[selectedStatColumn]?.includes("int") ||
      dtypes[selectedStatColumn]?.includes("float");

    if (isNumeric && values.length > 0) {
      const numVals = values.map(Number);
      const sum = numVals.reduce((a, b) => a + b, 0);
      const mean = sum / numVals.length;
      const sorted = [...numVals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...numVals);
      const max = Math.max(...numVals);

      setColumnStat({
        isNumeric: true,
        count: values.length,
        sum: sum.toFixed(2),
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
      });
    } else {
      // Categorical stats
      const counts: Record<string, number> = {};
      values.forEach((v) => {
        const str = String(v);
        counts[str] = (counts[str] || 0) + 1;
      });

      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const topVal = sortedCounts[0]?.[0] || "N/A";
      const topCount = sortedCounts[0]?.[1] || 0;

      setColumnStat({
        isNumeric: false,
        count: values.length,
        unique: Object.keys(counts).length,
        top: topVal,
        topFrequency: topCount,
      });
    }
  }, [selectedStatColumn, records, dtypes]);

  // Handle client-side sorting
  const handleSort = (col: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === col &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key: col, direction });
  };

  const sortedRecords = React.useMemo(() => {
    if (!sortConfig) return records;
    return [...records].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const numA = Number(aVal);
      const numB = Number(bVal);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [records, sortConfig]);

  // Client-side filtering & search
  const filteredRecords = React.useMemo(() => {
    if (!searchQuery) return sortedRecords;
    const lowerQuery = searchQuery.toLowerCase();
    return sortedRecords.filter((row) => {
      return Object.values(row).some(
        (val) =>
          val !== null &&
          val !== undefined &&
          String(val).toLowerCase().includes(lowerQuery),
      );
    });
  }, [sortedRecords, searchQuery]);

  // Pagination bounds
  const paginatedRecords = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Safe metrics extract
  const displayRows = kpis?.orders?.value || "0";
  const displayCols = kpis?.revenue?.change?.split(" ")[0] || "0";
  const displayRev = kpis?.revenue?.value || "$0.00";
  const displayAvg = kpis?.average_sales?.value || "$0.00";
  const displayMissing =
    kpis?.health?.missing_percentage !== undefined
      ? `${kpis.health.missing_percentage}%`
      : "0%";
  const displayDup =
    kpis?.health?.duplicate_percentage !== undefined
      ? `${kpis.health.duplicate_percentage}%`
      : "0%";

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header & Dataset selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-400" size={24} />
            <span>Interactive Data Analytics Console</span>
          </h1>
          <p className="text-zinc-500 text-sm font-sans">
            Audit datasets summaries, preview column types, or examine values
            tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Database size={14} className="text-indigo-400" />
          <select
            value={selectedDatasetId}
            onChange={(e) => handleDatasetChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-indigo-500 transition cursor-pointer max-w-[220px]"
          >
            <option value="">No dataset selected</option>
            {datasets.map((d) => (
              <option key={d.upload_id} value={d.upload_id}>
                {d.original_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      ) : selectedDatasetId ? (
        <div className="space-y-8">
          {/* Dynamic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-xl space-y-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">
                Dataset Dimensions
              </span>
              <div className="text-xl font-bold text-white font-mono">
                {displayRows} Rows
              </div>
              <p className="text-xs text-zinc-500">
                {displayCols} columns loaded in context
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">
                Aggregate Values Sum
              </span>
              <div className="text-xl font-bold text-white font-mono truncate">
                {displayRev}
              </div>
              <p className="text-xs text-zinc-500">
                Calculated over primary numeric column
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">
                Data Mean Average
              </span>
              <div className="text-xl font-bold text-white font-mono truncate">
                {displayAvg}
              </div>
              <p className="text-xs text-zinc-500">
                Normal distribution center density
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">
                Sanity Quality Ratios
              </span>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs font-bold text-zinc-300 font-mono">
                    {displayMissing}
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    Missing cells
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-300 font-mono">
                    {displayDup}
                  </div>
                  <span className="text-[9px] text-zinc-500">Duplicates</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Quality score: {kpis?.health?.health_score}%
              </p>
            </div>
          </div>

          {/* Quick Statistics Column Panel */}
          {columns.length > 0 && columnStat && (
            <div className="glass-panel p-5 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Info size={15} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Quick Column Statistics Descriptor
                  </span>
                </div>
                <select
                  value={selectedStatColumn}
                  onChange={(e) => setSelectedStatColumn(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c} ({dtypes[c] || "object"})
                    </option>
                  ))}
                </select>
              </div>

              {columnStat.isNumeric ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono text-center">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded">
                    <span className="text-[10px] text-zinc-500 block">Sum</span>
                    <strong className="text-zinc-200 text-sm">
                      {columnStat.sum}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded">
                    <span className="text-[10px] text-zinc-500 block">
                      Mean
                    </span>
                    <strong className="text-indigo-400 text-sm">
                      {columnStat.mean}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded">
                    <span className="text-[10px] text-zinc-500 block">
                      Median
                    </span>
                    <strong className="text-zinc-200 text-sm">
                      {columnStat.median}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded">
                    <span className="text-[10px] text-zinc-500 block">
                      Maximum
                    </span>
                    <strong className="text-emerald-400 text-sm">
                      {columnStat.max}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded">
                    <span className="text-[10px] text-zinc-500 block">
                      Minimum
                    </span>
                    <strong className="text-rose-400 text-sm">
                      {columnStat.min}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded text-center">
                    <span className="text-[10px] text-zinc-500 block">
                      Unique Cards Cardinality
                    </span>
                    <strong className="text-zinc-200 text-sm">
                      {columnStat.unique} unique values
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded text-center">
                    <span className="text-[10px] text-zinc-500 block">
                      Top Frequency Mode
                    </span>
                    <strong
                      className="text-indigo-400 text-sm truncate block max-w-full"
                      title={columnStat.top}
                    >
                      {columnStat.top}
                    </strong>
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded text-center">
                    <span className="text-[10px] text-zinc-500 block">
                      Mode Frequency Share
                    </span>
                    <strong className="text-zinc-200 text-sm">
                      {columnStat.topFrequency} times
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Professional CSV Dataset Explorer */}
          <div className="glass-panel rounded-xl border border-zinc-900 overflow-hidden space-y-4">
            {/* Search filter controls */}
            <div className="px-5 py-4 border-b border-zinc-900/60 bg-zinc-950/20 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="absolute left-3 top-3 text-zinc-500"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search table rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800/80 rounded-lg pl-9 pr-4 h-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  Total records matching:{" "}
                  <strong className="text-zinc-300 font-mono">
                    {filteredRecords.length}
                  </strong>
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-400 cursor-pointer focus:outline-none"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            {/* Table Viewport */}
            <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
              <table className="w-full border-collapse text-[11px] font-mono text-left">
                <thead className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-900">
                  <tr className="text-zinc-400">
                    {columns.map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="p-3.5 border-r border-zinc-900/60 cursor-pointer hover:bg-zinc-900/60 transition group font-sans font-semibold"
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <span>{col}</span>
                          <span className="text-[8px] text-zinc-600 font-normal">
                            {sortConfig?.key === col
                              ? sortConfig.direction === "asc"
                                ? "▲"
                                : "▼"
                              : "↕"}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-600 font-mono font-normal tracking-tight pt-0.5">
                          {dtypes[col] || "object"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="p-8 text-center text-zinc-600 italic"
                      >
                        No records matching searches.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b border-zinc-900/40 hover:bg-zinc-900/20 text-zinc-300"
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="p-3 border-r border-zinc-900/40 truncate max-w-[150px]"
                          >
                            {row[col] === null || row[col] === undefined ? (
                              <span className="text-zinc-600 italic">NULL</span>
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-5 py-4 border-t border-zinc-900/60 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-sans">
                Showing page{" "}
                <strong className="text-zinc-300">{currentPage}</strong> of{" "}
                <strong className="text-zinc-300">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                >
                  <ChevronLeft size={14} />
                </button>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
          <Database size={32} className="text-zinc-700 animate-bounce" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-400">
              No Datasets Ingested
            </h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Ingest a CSV dataset inside the upload portal first to activate
              stats calculations and tables exploration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default AnalyticsPage;
