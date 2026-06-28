import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Clock,
  Terminal,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryItem {
  history_id: string;
  session_id: string;
  question: string;
  answer: string;
  timestamp: string;
  execution_time_ms: number;
  selected_tool: string;
  detected_intent: string;
  has_chart: boolean;
}

export const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (search?: string) => {
    setLoading(true);
    try {
      const url = search
        ? `http://https://smart-csv-data-analyst-api.onrender.com/api/chat/history/list?search=${encodeURIComponent(search)}`
        : "http://https://smart-csv-data-analyst-api.onrender.com/api/chat/history/list";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.warn("Failed to load query history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchQuery);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `http://https://smart-csv-data-analyst-api.onrender.com/api/chat/history/item/${id}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setHistoryItems((prev) =>
          prev.filter((item) => item.history_id !== id),
        );
        if (expandedId === id) setExpandedId(null);
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    window.open(
      `http://https://smart-csv-data-analyst-api.onrender.com/api/chat/history/export/download?format=${format}`,
      "_blank",
    );
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="text-indigo-400" size={24} />
            <span>Audit Query History</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Review, analyze, and export past conversational executions logged in
            the session.
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition"
          >
            <FileJson size={14} className="text-yellow-500" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-2.5 text-zinc-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search past questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/40 border border-zinc-900 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
        >
          Search
        </button>
      </form>

      {/* Main List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-zinc-900 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : historyItems.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {historyItems.map((item) => {
              const isExpanded = expandedId === item.history_id;
              return (
                <motion.div
                  key={item.history_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel rounded-2xl overflow-hidden border border-zinc-900/60"
                >
                  {/* Row Summary */}
                  <div
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.history_id)
                    }
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/20 transition select-none"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 mt-0.5">
                        <Terminal size={15} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">
                          {item.question}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-medium">
                          <span>
                            Intent:{" "}
                            <b className="text-indigo-400 font-bold">
                              {item.detected_intent}
                            </b>
                          </span>
                          <span>
                            Tool:{" "}
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">
                              {item.selected_tool}
                            </code>
                          </span>
                          <span>
                            Time:{" "}
                            <span className="font-mono text-zinc-400">
                              {item.execution_time_ms.toFixed(1)}ms
                            </span>
                          </span>
                          <span>
                            Logged:{" "}
                            <span className="font-mono">
                              {formatDate(item.timestamp)}
                            </span>
                          </span>
                          {item.has_chart && (
                            <span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Chart
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.history_id);
                        }}
                        className="p-1.5 rounded hover:bg-zinc-900 text-zinc-600 hover:text-red-400 transition"
                        title="Delete log item"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="text-zinc-500">
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Answer content */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-zinc-900/60 bg-zinc-950/20 space-y-3">
                      <h5 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        Assistant Response
                      </h5>
                      <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/50 font-sans whitespace-pre-wrap">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
          <AlertCircle size={32} className="text-zinc-700 animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-400">
              No Query History Logged
            </h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Conversations logs will automatically index here. Try asking a
              summary question in the AI Chat window first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default HistoryPage;
