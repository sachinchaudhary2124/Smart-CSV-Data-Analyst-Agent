import React, { useState, useEffect } from "react";
import { api, API_BASE_URL } from "../../services/api";
import {
  Download,
  TrendingUp,
  FileText,
  AlertCircle,
  Database,
  Award,
  ShieldAlert,
  Compass,
  ListTodo,
  Sparkles,
} from "lucide-react";

interface DatasetMetadata {
  upload_id: string;
  original_name: string;
}

interface AIExecutiveSummary {
  upload_id: string;
  dataset_name: string;
  executive_summary: string;
  key_findings: string[];
  business_risks: string[];
  growth_opportunities: string[];
  recommended_actions: Array<{ title: string; action: string }>;
  future_predictions: string[];
  priority_score: number;
  business_health_score: number;
  confidence_score: number;
}

export const ReportsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  const [report, setReport] = useState<AIExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch uploads list
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
        console.warn("Failed loading datasets in reports page:", err);
      }
    };
    fetchDatasets();
  }, []);

  const handleDatasetChange = async (id: string) => {
    setSelectedDatasetId(id);
    try {
      await api.post(`/upload/active/${id}`);
    } catch (err) {
      console.error("Failed setting active dataset:", err);
    }
  };

  // Fetch dynamically generated AI Report Summary on dataset select
  useEffect(() => {
    if (!selectedDatasetId) {
      setLoading(false);
      return;
    }

    const fetchGeneratedSummary = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/report/generate/${selectedDatasetId}`);
        setReport(data);
      } catch (err) {
        console.error("Failed fetching report summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeneratedSummary();
  }, [selectedDatasetId]);

  const handleExportPDF = () => {
    if (!selectedDatasetId) return;
    window.open(
      `${API_BASE_URL}/report/pdf/${selectedDatasetId}`,
      "_blank",
    );
  };

  const handleExportPPTX = () => {
    if (!selectedDatasetId) return;
    window.open(
      `${API_BASE_URL}/report/pptx/${selectedDatasetId}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="text-indigo-400" size={24} />
            <span>AI Executive Reports & Exports</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Review compiled business summaries, key opportunities, and download
            structured documents.
          </p>
        </div>

        {selectedDatasetId && report && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-premium transition flex-1 sm:flex-initial"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleExportPPTX}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition flex-1 sm:flex-initial"
            >
              <Download size={14} />
              <span>Download PPTX</span>
            </button>
          </div>
        )}
      </div>

      {/* Dataset Selection */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-zinc-900/60 max-w-md">
        <Database size={15} className="text-indigo-400" />
        <span className="text-xs text-zinc-400 font-semibold">
          Target Dataset:
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

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-zinc-900 rounded-xl" />
            <div className="md:col-span-2 h-96 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Health and Confidence Scores */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-panel p-5 rounded-2xl border border-zinc-900/50 space-y-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Analysis Health Summary
              </h3>

              {/* Health Score Gauge */}
              <div className="flex items-center justify-between gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900/40">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Business Health
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {report.business_health_score}%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center font-mono text-[10px] font-bold text-indigo-400">
                  HEALTH
                </div>
              </div>

              {/* Confidence Score Gauge */}
              <div className="flex items-center justify-between gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900/40">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    AI Confidence Score
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {report.confidence_score}%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-mono text-[10px] font-bold text-emerald-400">
                  CONF
                </div>
              </div>

              {/* Priority Action Level */}
              <div className="flex items-center justify-between gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900/40">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Action Priority
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {report.priority_score}{" "}
                    <span className="text-xs text-zinc-500 font-medium">
                      / 100
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 flex items-center justify-center font-mono text-[10px] font-bold text-rose-400">
                  PRIO
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Executive Summary Sections */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-zinc-900/50 bg-zinc-950/20 space-y-6">
              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Executive Summary</span>
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-4 rounded-xl border border-zinc-900/60 font-sans">
                  {report.executive_summary}
                </p>
              </div>

              {/* Key Findings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-400" />
                  <span>Key Findings</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.key_findings.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-900/20 border border-zinc-900/50 text-[11px] text-zinc-300 leading-relaxed"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks & Opportunities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Risks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-rose-400" />
                    <span>Business Risks</span>
                  </h3>
                  <div className="space-y-2.5">
                    {report.business_risks.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-[11px] text-zinc-300 leading-normal"
                      >
                        <AlertCircle
                          size={14}
                          className="text-rose-400 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opportunities */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass size={14} className="text-emerald-400" />
                    <span>Growth Opportunities</span>
                  </h3>
                  <div className="space-y-2.5">
                    {report.growth_opportunities.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-zinc-300 leading-normal"
                      >
                        <TrendingUp
                          size={14}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ListTodo size={14} className="text-indigo-400" />
                  <span>Recommended Action Plan</span>
                </h3>
                <div className="space-y-2.5">
                  {report.recommended_actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 p-4 rounded-xl bg-zinc-900/40 border border-zinc-900/60"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-200">
                          {act.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          <span className="text-indigo-400 font-semibold">
                            Action:{" "}
                          </span>
                          {act.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predictions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-indigo-400" />
                  <span>Future Predictions</span>
                </h3>
                <ul className="list-disc pl-5 text-[11px] text-zinc-300 space-y-2 leading-relaxed">
                  {report.future_predictions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle size={28} className="text-zinc-600" />
          <p className="text-xs text-zinc-500">
            No active dataset selected. Pick an ingested CSV from the selector
            to view reports.
          </p>
        </div>
      )}
    </div>
  );
};
export default ReportsPage;
