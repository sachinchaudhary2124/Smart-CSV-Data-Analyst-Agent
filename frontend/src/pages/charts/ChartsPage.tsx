import React, { useState, useEffect, useRef } from "react";
import {
  BarChart2,
  Maximize2,
  Minimize2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Database,
  Info,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface DatasetMetadata {
  upload_id: string;
  original_name: string;
}

export const ChartsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dimension Selectors
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState<
    "line" | "bar" | "pie" | "scatter" | "area"
  >("bar");

  // Interactive controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tooltip details
  const [activeTooltip, setActiveTooltip] = useState<{
    name: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch recent uploads
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
        console.warn(err);
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

  // Fetch records on select
  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/${selectedDatasetId}/records`,
        );
        if (res.ok) {
          const data = await res.json();
          setColumns(data.columns);
          setRecords(data.records);
          if (data.columns.length > 0) {
            setXAxis(data.columns[0]);
            // Pick first numeric column for Y if possible
            const numericCol = data.columns.find(
              (c: string) =>
                data.data_types[c]?.includes("int") ||
                data.data_types[c]?.includes("float"),
            );
            setYAxis(numericCol || data.columns[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [selectedDatasetId]);

  const roundNumber = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  // Aggregate Chart Points
  const chartPoints = React.useMemo(() => {
    if (!xAxis || !yAxis || records.length === 0) return [];

    const groups: Record<string, number> = {};
    records.forEach((row) => {
      const xVal = String(row[xAxis] || "N/A");
      const yVal = Number(row[yAxis] || 0);
      groups[xVal] = (groups[xVal] || 0) + (isNaN(yVal) ? 0 : yVal);
    });

    const items = Object.entries(groups).map(([name, value]) => ({
      name,
      value: roundNumber(value),
    }));

    // Bounded maximum length of items to prevent rendering overflow
    return items.slice(0, 12);
  }, [records, xAxis, yAxis]);

  // Calculations for AI Chart Explainer (Feature 7)
  const explainerData = React.useMemo(() => {
    if (chartPoints.length === 0) return null;

    const sorted = [...chartPoints].sort((a, b) => b.value - a.value);
    const topItem = sorted[0];
    const bottomItem = sorted[sorted.length - 1];
    const totalSum = chartPoints.reduce((sum, item) => sum + item.value, 0);
    const topPct =
      totalSum > 0 ? ((topItem.value / totalSum) * 100).toFixed(1) : "0";

    return {
      topName: topItem.name,
      topVal: topItem.value.toLocaleString(),
      topPct,
      worstName: bottomItem.name,
      worstVal: bottomItem.value.toLocaleString(),
      total: totalSum.toLocaleString(),
    };
  }, [chartPoints]);

  // SVG Calculations
  const width = 600;
  const height = 300;
  const padding = 55;

  const maxVal = Math.max(...chartPoints.map((p) => p.value), 10);

  const getCoordinates = (index: number, val: number) => {
    if (chartPoints.length === 0) return { x: 0, y: 0 };
    const x =
      padding + (index / (chartPoints.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (val / maxVal) * (height - 2 * padding);
    return { x, y };
  };

  const transformStyle = {
    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
    transformOrigin: "center",
    transition: isDragging ? "none" : "transform 0.15s ease-out",
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const url =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    const link = document.createElement("a");
    link.href = url;
    link.download = `chart_${xAxis}_vs_${yAxis}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; // high res
      canvas.height = height * 2;
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(2, 2);
        context.fillStyle = "#09090b";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0);

        const pngURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngURL;
        link.download = `chart_${xAxis}_vs_${yAxis}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Download raw chart points as CSV (Feature 6)
  const handleDownloadCSV = () => {
    if (chartPoints.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Dimension (${xAxis}),Value (${yAxis})\n`;
    chartPoints.forEach((pt) => {
      csvContent += `"${pt.name.replace(/"/g, '""')}",${pt.value}\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `chart_data_${xAxis}_vs_${yAxis}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`space-y-8 animate-fadeIn max-w-7xl mx-auto ${isFullscreen ? "fixed inset-0 z-50 bg-stone-950 p-8 overflow-y-auto" : ""}`}
    >
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="text-indigo-400" size={24} />
            <span>Interactive Data Visualizations</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Design and execute custom chart figures dynamically over columns
            dimensions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFullscreen ? (
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              <Minimize2 size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Database size={14} className="text-indigo-400" />
              <select
                value={selectedDatasetId}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-semibold cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.upload_id} value={d.upload_id}>
                    {d.original_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-zinc-900 animate-pulse rounded-2xl" />
      ) : selectedDatasetId && chartPoints.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Box */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-5 rounded-2xl space-y-4 border border-zinc-900/60">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Dimension Settings
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase">
                    X-Axis Dimension
                  </label>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase">
                    Y-Axis Values Measure
                  </label>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase">
                    Visual Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["bar", "line", "pie", "scatter", "area"] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setChartType(type)}
                          className={`px-2 py-1.5 rounded border text-[11px] font-semibold text-center uppercase tracking-wider transition ${
                            chartType === type
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {type}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Figure Canvas */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 relative">
              {/* Float Visual Action Buttons */}
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.min(3, prev + 0.15))
                  }
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.max(0.5, prev - 0.15))
                  }
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  title="Reset Zoom & Pan"
                >
                  <RotateCcw size={13} />
                </button>
                <span className="w-px h-4 bg-zinc-800"></span>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white font-bold"
                  title="Download raw data points as CSV"
                >
                  <FileSpreadsheet size={12} className="text-emerald-500" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  title="Download SVG configuration"
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={handleDownloadPNG}
                  className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white font-bold"
                  title="Download PNG snapshot"
                >
                  PNG
                </button>
                {!isFullscreen && (
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    title="Fullscreen Mode"
                  >
                    <Maximize2 size={13} />
                  </button>
                )}
              </div>

              {/* Responsive Chart Viewer Box */}
              <div
                className="w-full select-none cursor-move h-[320px] flex items-center justify-center overflow-hidden relative"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${width} ${height}`}
                  className="overflow-visible"
                  style={transformStyle}
                >
                  {/* Grid lines */}
                  {[...Array(5)].map((_, i) => {
                    const y = padding + (i / 4) * (height - 2 * padding);
                    const val = maxVal - (i / 4) * maxVal;
                    return (
                      <g key={i}>
                        <line
                          x1={padding}
                          y1={y}
                          x2={width - padding}
                          y2={y}
                          stroke="#18181b"
                          strokeWidth="0.8"
                          strokeDasharray="3"
                        />
                        <text
                          x={padding - 10}
                          y={y + 4}
                          fill="#52525b"
                          fontSize="8"
                          textAnchor="end"
                          className="font-mono"
                        >
                          {val >= 1000
                            ? `${(val / 1000).toFixed(1)}k`
                            : val.toFixed(0)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Visual Layout types */}
                  {chartType === "bar" &&
                    chartPoints.map((p, idx) => {
                      const coords = getCoordinates(idx, p.value);
                      const barWidth = Math.max(
                        12,
                        (width - 2 * padding) / (chartPoints.length * 1.6),
                      );
                      const barHeight = height - padding - coords.y;

                      return (
                        <g
                          key={idx}
                          className="cursor-pointer group"
                          onMouseEnter={() =>
                            setActiveTooltip({
                              name: p.name,
                              value: p.value,
                              x: coords.x,
                              y: coords.y - 10,
                            })
                          }
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <rect
                            x={coords.x - barWidth / 2}
                            y={coords.y}
                            width={barWidth}
                            height={barHeight}
                            rx="2.5"
                            fill="url(#barGrad)"
                            className="hover:opacity-100 transition opacity-80"
                          />
                          <text
                            x={coords.x}
                            y={height - padding + 15}
                            fill="#71717a"
                            fontSize="8"
                            textAnchor="middle"
                            className="font-sans font-medium"
                          >
                            {p.name.length > 8
                              ? `${p.name.slice(0, 6)}..`
                              : p.name}
                          </text>
                        </g>
                      );
                    })}

                  {chartType === "line" && (
                    <>
                      <path
                        d={chartPoints
                          .map((p, idx) => {
                            const c = getCoordinates(idx, p.value);
                            return `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {chartPoints.map((p, idx) => {
                        const c = getCoordinates(idx, p.value);
                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onMouseEnter={() =>
                              setActiveTooltip({
                                name: p.name,
                                value: p.value,
                                x: c.x,
                                y: c.y - 10,
                              })
                            }
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="4"
                              fill="#6366f1"
                              stroke="#09090b"
                              strokeWidth="1"
                            />
                            <text
                              x={c.x}
                              y={height - padding + 15}
                              fill="#71717a"
                              fontSize="8"
                              textAnchor="middle"
                            >
                              {p.name.length > 8
                                ? `${p.name.slice(0, 6)}..`
                                : p.name}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  )}

                  {chartType === "area" && (
                    <>
                      <path
                        d={`${chartPoints
                          .map((p, idx) => {
                            const c = getCoordinates(idx, p.value);
                            return `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`;
                          })
                          .join(
                            " ",
                          )} L ${getCoordinates(chartPoints.length - 1, 0).x} ${height - padding} L ${getCoordinates(0, 0).x} ${height - padding} Z`}
                        fill="url(#areaGrad)"
                        opacity="0.25"
                      />
                      <path
                        d={chartPoints
                          .map((p, idx) => {
                            const c = getCoordinates(idx, p.value);
                            return `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                      />
                      {chartPoints.map((p, idx) => {
                        const c = getCoordinates(idx, p.value);
                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onMouseEnter={() =>
                              setActiveTooltip({
                                name: p.name,
                                value: p.value,
                                x: c.x,
                                y: c.y - 10,
                              })
                            }
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="3.5"
                              fill="#6366f1"
                              stroke="#09090b"
                              strokeWidth="0.8"
                            />
                            <text
                              x={c.x}
                              y={height - padding + 15}
                              fill="#71717a"
                              fontSize="8"
                              textAnchor="middle"
                            >
                              {p.name.length > 8
                                ? `${p.name.slice(0, 6)}..`
                                : p.name}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  )}

                  {chartType === "scatter" &&
                    chartPoints.map((p, idx) => {
                      const c = getCoordinates(idx, p.value);
                      return (
                        <g
                          key={idx}
                          className="cursor-pointer"
                          onMouseEnter={() =>
                            setActiveTooltip({
                              name: p.name,
                              value: p.value,
                              x: c.x,
                              y: c.y - 10,
                            })
                          }
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r="5.5"
                            fill="#a855f7"
                            opacity="0.85"
                            stroke="#09090b"
                            strokeWidth="1"
                          />
                          <text
                            x={c.x}
                            y={height - padding + 15}
                            fill="#71717a"
                            fontSize="8"
                            textAnchor="middle"
                          >
                            {p.name.length > 8
                              ? `${p.name.slice(0, 6)}..`
                              : p.name}
                          </text>
                        </g>
                      );
                    })}

                  {chartType === "pie" &&
                    (() => {
                      const totalVal = chartPoints.reduce(
                        (a, b) => a + b.value,
                        0,
                      );
                      let accumulatedAngle = 0;

                      return chartPoints.map((p, idx) => {
                        const percentage =
                          totalVal > 0 ? p.value / totalVal : 0;
                        const angle = percentage * 360;

                        const radStart =
                          ((accumulatedAngle - 90) * Math.PI) / 180;
                        const radEnd =
                          ((accumulatedAngle + angle - 90) * Math.PI) / 180;

                        accumulatedAngle += angle;

                        const r = 85;
                        const cx = width / 2;
                        const cy = height / 2 - 10;

                        const x1 = cx + r * Math.cos(radStart);
                        const y1 = cy + r * Math.sin(radStart);
                        const x2 = cx + r * Math.cos(radEnd);
                        const y2 = cy + r * Math.sin(radEnd);

                        const largeArc = angle > 180 ? 1 : 0;

                        const colors = [
                          "#6366f1",
                          "#06b6d4",
                          "#ec4899",
                          "#10b981",
                          "#f59e0b",
                          "#8b5cf6",
                          "#ef4444",
                        ];
                        const sliceColor = colors[idx % colors.length];

                        // Midpoint for tooltip
                        const midRad =
                          ((accumulatedAngle - angle / 2 - 90) * Math.PI) / 180;
                        const tx = cx + r * 0.5 * Math.cos(midRad);
                        const ty = cy + r * 0.5 * Math.sin(midRad);

                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onMouseEnter={() =>
                              setActiveTooltip({
                                name: p.name,
                                value: p.value,
                                x: tx,
                                y: ty,
                              })
                            }
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <path
                              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={sliceColor}
                              opacity="0.8"
                              className="hover:opacity-100 transition"
                            />
                            {percentage > 0.06 && (
                              <text
                                x={cx + r * 0.65 * Math.cos(midRad)}
                                y={cy + r * 0.65 * Math.sin(midRad)}
                                fill="#fff"
                                fontSize="7.5"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {p.name.length > 5
                                  ? `${p.name.slice(0, 4)}.`
                                  : p.name}
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}

                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop
                        offset="100%"
                        stopColor="#4f46e5"
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Professional Animated Tooltip Box */}
                {activeTooltip && (
                  <div
                    className="absolute bg-zinc-950/95 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-xl text-[10px] pointer-events-none shadow-premium z-20 space-y-0.5"
                    style={{
                      left: `calc(50% + ${activeTooltip.x - width / 2}px)`,
                      top: `calc(50% + ${activeTooltip.y - height / 2 - 15}px)`,
                    }}
                  >
                    <span className="font-mono text-zinc-500 font-bold block">
                      {xAxis.toUpperCase()}: {activeTooltip.name}
                    </span>
                    <span className="font-sans font-bold text-indigo-400 block">
                      {yAxis.toUpperCase()}:{" "}
                      {activeTooltip.value.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Chart Explainer Section (Feature 7) */}
            {explainerData && (
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900/60 bg-gradient-to-br from-zinc-950/40 to-zinc-950/10 space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-900/50 pb-3">
                  <Info size={16} className="text-indigo-400" />
                  <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-widest">
                    AI Chart Explainer
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-indigo-400" />
                        <span>What this chart shows</span>
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/20 p-3 rounded-xl border border-zinc-900/40">
                        This data visualization plots the aggregate values of
                        metric **{yAxis}** grouped across discrete segments of
                        variable **{xAxis}**. A total cumulative measure of **$
                        {explainerData.total}** is calculated.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Info size={13} className="text-indigo-400" />
                        <span>Important observations</span>
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/20 p-3 rounded-xl border border-zinc-900/40">
                        The highest aggregate concentration is held by segment
                        **'{explainerData.topName}'** contributing **$
                        {explainerData.topVal}** ({explainerData.topPct}%
                        share). The lowest aggregate value is tracked in segment
                        **'{explainerData.worstName}'** (
                        {explainerData.worstVal}).
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-500" />
                        <span>Possible reasons & Business impact</span>
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/20 p-3 rounded-xl border border-zinc-900/40">
                        High revenue concentration in **'{explainerData.topName}
                        '** indicates robust client demand or wholesale bulk
                        sales, which creates supply chain exposure. A regulatory
                        bottleneck or competitor launch in this segment poses a
                        direct margin threat.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb size={13} className="text-emerald-500" />
                        <span>Business Recommendation</span>
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/20 p-3 rounded-xl border border-zinc-900/40">
                        We recommend diversifying operations by allocating
                        secondary marketing channel budgets towards
                        underperforming segments like **'
                        {explainerData.worstName}'** to establish portfolio
                        equilibrium and minimize concentration risks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              Please ingest a CSV file inside the upload portal first to enable
              dynamic visual graphs drawing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChartsPage;
