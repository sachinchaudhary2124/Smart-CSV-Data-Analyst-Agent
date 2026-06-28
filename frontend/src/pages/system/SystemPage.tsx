import React, { useState, useEffect } from "react";
import {
  Terminal,
  Cpu,
  Database,
  Activity,
  RefreshCw,
  FolderOpen,
  Clock,
  Zap,
  Layers,
  Wrench,
  Percent,
} from "lucide-react";

interface SystemDiagnostics {
  api_status: string;
  version: string;
  memory_usage_mb: number;
  storage: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    upload_folder_path: string;
  };
  logs: {
    file_path: string;
    size_bytes: number;
    status: string;
  };
  model: {
    engine: string;
    model_name: string;
    endpoint: string;
    connected: boolean;
  };
}

interface EngineeringMetrics {
  average_response_time_ms: number;
  average_tool_execution_time_ms: number;
  most_used_tool: string;
  total_queries: number;
  total_uploaded_files: number;
  charts_generated: number;
  reports_generated: number;
  cache_hit_rate: number;
  cache_size: number;
  cache_hits: number;
  cache_misses: number;
  memory_usage_mb: number;
  uptime_seconds: number;
  tool_usage: Record<string, number>;
}

export const SystemPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(
    null,
  );
  const [metrics, setMetrics] = useState<EngineeringMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    setRefreshing(true);
    try {
      const [diagRes, metrRes] = await Promise.all([
        fetch(
          "http://https://smart-csv-data-analyst-api.onrender.com/api/system",
        ),
        fetch(
          "http://https://smart-csv-data-analyst-api.onrender.com/api/system/metrics",
        ),
      ]);

      if (diagRes.ok) {
        const dData = await diagRes.json();
        setDiagnostics(dData);
      }
      if (metrRes.ok) {
        const mData = await metrRes.json();
        setMetrics(mData);
      }
    } catch (err) {
      console.warn("Failed fetching telemetry logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-zinc-900 w-1/4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60 bg-zinc-900 rounded-xl" />
          <div className="h-60 bg-zinc-900 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Terminal size={24} className="text-indigo-400" />
            <span>Engineering System & Telemetry Diagnostics</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Monitor runtime metrics, response latencies, RAM consumption, and
            caching performance.
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition shadow-sm"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* average latency */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Avg Latency
              </span>
              <h4 className="text-lg font-bold text-white font-mono">
                {metrics.average_response_time_ms.toFixed(0)}ms
              </h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Zap size={16} />
            </div>
          </div>

          {/* Uptime */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Daemon Uptime
              </span>
              <h4 className="text-lg font-bold text-white font-mono">
                {formatUptime(metrics.uptime_seconds)}
              </h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Clock size={16} />
            </div>
          </div>

          {/* cache efficiency */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Cache Hit Ratio
              </span>
              <h4 className="text-lg font-bold text-white font-mono">
                {(metrics.cache_hit_rate * 100).toFixed(1)}%
              </h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Percent size={16} />
            </div>
          </div>

          {/* Memory rss */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Allocated RAM
              </span>
              <h4 className="text-lg font-bold text-white font-mono">
                {metrics.memory_usage_mb.toFixed(1)} MB
              </h4>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Cpu size={16} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry statistics list */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" />
            <span>Platform Workload Metrics</span>
          </h3>

          {metrics && (
            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Total User Queries
                </span>
                <span className="text-zinc-300 font-bold">
                  {metrics.total_queries}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Files in Workspace
                </span>
                <span className="text-zinc-300 font-bold">
                  {metrics.total_uploaded_files}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">Charts Formed</span>
                <span className="text-zinc-300 font-bold">
                  {metrics.charts_generated}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Reports Generated
                </span>
                <span className="text-zinc-300 font-bold">
                  {metrics.reports_generated}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cache & Caching details */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            <span>Cache Analytics</span>
          </h3>

          {metrics && (
            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Cache hits count
                </span>
                <span className="text-emerald-400 font-bold">
                  {metrics.cache_hits}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Cache misses count
                </span>
                <span className="text-rose-400 font-bold">
                  {metrics.cache_misses}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Cached memory size
                </span>
                <span className="text-zinc-300">
                  {metrics.cache_size} items
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">Avg Tool Delay</span>
                <span className="text-indigo-400 font-bold">
                  {metrics.average_tool_execution_time_ms.toFixed(0)}ms
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mapped tools counts */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <Wrench size={16} className="text-purple-400" />
            <span>Agent Tool Distributions</span>
          </h3>

          {metrics &&
          metrics.tool_usage &&
          Object.keys(metrics.tool_usage).length > 0 ? (
            <div className="space-y-3.5 text-xs font-mono max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(metrics.tool_usage).map(([tool, count]) => (
                <div
                  key={tool}
                  className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-900"
                >
                  <span
                    className="text-zinc-400 text-[10px] truncate max-w-[150px]"
                    title={tool}
                  >
                    {tool}
                  </span>
                  <span className="text-indigo-400 font-bold">
                    {count} calls
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-zinc-600 text-xs font-sans">
              No tool logs computed in active run cycle.
            </div>
          )}
        </div>
      </div>

      {diagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage spaces */}
          <div className="glass-panel p-6 rounded-xl border border-zinc-900 space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} className="text-emerald-400" />
              <span>Storage Partition Footprint</span>
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs font-mono text-center">
              <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded">
                <span className="text-[9px] text-zinc-500 block mb-1">
                  Total Capacity
                </span>
                <span className="text-sm font-bold text-zinc-200">
                  {diagnostics.storage.total_gb} GB
                </span>
              </div>
              <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded">
                <span className="text-[9px] text-zinc-500 block mb-1">
                  Used Space
                </span>
                <span className="text-sm font-bold text-zinc-400">
                  {diagnostics.storage.used_gb} GB
                </span>
              </div>
              <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded">
                <span className="text-[9px] text-zinc-500 block mb-1">
                  Available Free
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {diagnostics.storage.free_gb} GB
                </span>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded text-[10px] space-y-1 text-zinc-400 font-mono">
              <div className="flex items-center gap-2 text-zinc-500">
                <FolderOpen size={13} />
                <span>Sandbox Directory Path:</span>
              </div>
              <span className="block truncate text-zinc-300 select-all">
                {diagnostics.storage.upload_folder_path}
              </span>
            </div>
          </div>

          {/* Local models status */}
          <div className="glass-panel p-6 rounded-xl border border-zinc-900 space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Cpu size={16} className="text-pink-400" />
              <span>Local Model daemon connection</span>
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">Model Engine</span>
                <span className="text-zinc-300">
                  {diagnostics.model.engine}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">Endpoint url</span>
                <span className="text-zinc-300 truncate max-w-[150px]">
                  {diagnostics.model.endpoint}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-zinc-500 font-sans">
                  Connection State
                </span>
                <span
                  className={
                    diagnostics.model.connected
                      ? "text-emerald-400 font-bold"
                      : "text-rose-400 font-bold"
                  }
                >
                  {diagnostics.model.connected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemPage;
