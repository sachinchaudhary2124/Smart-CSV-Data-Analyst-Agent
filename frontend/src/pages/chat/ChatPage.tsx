import React, { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Database,
  Terminal,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Copy,
  Download,
  HelpCircle,
  Activity,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  supporting_statistics?: string;
  business_insight?: {
    observation: string;
    reason: string;
    business_impact: string;
    recommendation: string;
    confidence_score: number;
  };
  chart_data?: any;
  execution_time_ms?: number;
  confidence_score?: number;
  selected_tool?: string;
  detected_intent?: string;
  workflow_trace?: any[];
}

interface UploadedDataset {
  upload_id: string;
  original_name: string;
}

const graphNodesList = [
  { id: "intent_analyzer", label: "Understanding Question", icon: "🧠" },
  { id: "dataset_validator", label: "Inspecting Dataset", icon: "🔎" },
  { id: "tool_planner", label: "Selecting Tool", icon: "🛠️" },
  { id: "tool_executor", label: "Running Analysis", icon: "⚙️" },
  { id: "insight_generator", label: "Generating Insights", icon: "💡" },
  { id: "response_formatter", label: "Preparing Response", icon: "📝" },
  { id: "conversation_memory", label: "Finalizing Context", icon: "💾" },
];

export const ChatPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const [executingNode, setExecutingNode] = useState<string | null>(null);
  const [thoughtLog, setThoughtLog] = useState<string[]>([]);

  const [datasets, setDatasets] = useState<UploadedDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [activeReasoning, setActiveReasoning] = useState<any>(null);

  const [suggestions, setSuggestions] = useState<string[]>([
    "Show monthly sales trend",
    "Find outliers",
    "Identify anomalies in revenue",
    "What is the monthly sales forecast?",
    "Create dashboard for sales",
  ]);

  const fetchSuggestions = async (id: string) => {
    try {
      const profile = await api.get(`/upload/${id}/profile`);
      if (
        profile.suggested_questions &&
        profile.suggested_questions.length > 0
      ) {
        setSuggestions(profile.suggested_questions);
      }
    } catch (err) {
      console.warn("Failed loading suggestions", err);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      fetchSuggestions(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initSession = async () => {
    try {
      const { session_id } = await api.post("/chat/session");
      setSessionId(session_id);
      setMessages([
        {
          role: "assistant",
          content:
            "Welcome! Choose a dataset from the selector and ask me queries. I'll automatically analyze statistical aggregates, plot diagrams, and construct recommendations.",
        },
      ]);

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
      console.error(err);
    }
  };

  const handleDatasetChange = async (id: string) => {
    setSelectedDatasetId(id);
    try {
      await api.post(`/upload/active/${id}`);
    } catch (err) {
      console.error("Failed setting active dataset:", err);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, executingNode]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setThoughtLog([]);
    setActiveNodeIndex(0);
    setExecutingNode("intent_analyzer");

    try {
      const data = await api.post("/chat/query", {
        session_id: sessionId,
        message: text,
        dataset_id: selectedDatasetId || null,
      });



      // Workflow node sequence simulation
      const nodeTrace = data.workflow_trace || [
        {
          node: "intent_analyzer",
          status: "completed",
          execution_time_ms: 12.0,
          tool_selected: null,
        },
        {
          node: "dataset_validator",
          status: "completed",
          execution_time_ms: 4.0,
          tool_selected: null,
        },
        {
          node: "tool_planner",
          status: "completed",
          execution_time_ms: 5.0,
          tool_selected: data.selected_tool,
        },
        {
          node: "tool_executor",
          status: "completed",
          execution_time_ms: data.execution_time_ms,
          tool_selected: data.selected_tool,
        },
        {
          node: "insight_generator",
          status: "completed",
          execution_time_ms: 15.0,
          tool_selected: null,
        },
        {
          node: "response_formatter",
          status: "completed",
          execution_time_ms: 10.0,
          tool_selected: null,
        },
        {
          node: "conversation_memory",
          status: "completed",
          execution_time_ms: 3.0,
          tool_selected: null,
        },
      ];

      // Step animation sequence
      for (let i = 0; i < nodeTrace.length; i++) {
        setActiveNodeIndex(i);
        const traceItem = nodeTrace[i];
        setExecutingNode(traceItem.node);
        setThoughtLog((prev) => [
          ...prev,
          `[${traceItem.node}] Executed in ${traceItem.execution_time_ms}ms`,
        ]);
        await new Promise((resolve) => setTimeout(resolve, 320));
      }

      setExecutingNode(null);
      setActiveNodeIndex(null);

      const rawText = data.answer;
      let streamedText = "";
      const interval = 8;

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        supporting_statistics: data.supporting_statistics,
        business_insight: data.business_insight,
        chart_data: data.chart_data,
        execution_time_ms: data.execution_time_ms,
        confidence_score: data.confidence_score,
        selected_tool: data.selected_tool,
        detected_intent: data.detected_intent,
        workflow_trace: nodeTrace,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let charIndex = 0;
      const typeText = () => {
        if (charIndex < rawText.length) {
          streamedText += rawText.charAt(charIndex);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: streamedText,
            };
            return updated;
          });
          charIndex++;
          setTimeout(typeText, interval);
        } else {
          setActiveReasoning({
            detected_intent: data.detected_intent,
            selected_tool: data.selected_tool,
            execution_time_ms: data.execution_time_ms,
            confidence_score: data.confidence_score,
            dataset:
              datasets.find((d) => d.upload_id === selectedDatasetId)
                ?.original_name || "N/A",
            thoughts: data.thoughts || thoughtLog,
            insight: data.business_insight,
            stats: data.supporting_statistics,
            workflow_trace: nodeTrace,
          });
          setLoading(false);
        }
      };

      typeText();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Pipeline failed to execute query. Check if the backend daemon is online.",
        },
      ]);
      setLoading(false);
      setExecutingNode(null);
      setActiveNodeIndex(null);
    }
  };

  const handleClearHistory = async () => {
    if (!sessionId) return;
    try {
      await api.delete(`/chat/session/${sessionId}`);
      setMessages([
        { role: "assistant", content: "Conversation history cleared." },
      ]);
      setActiveReasoning(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleExportMarkdown = (msg: Message) => {
    const md =
      `# AI Agent Analysis Response\n\n` +
      `${msg.content}\n\n` +
      `## Supporting Statistics\n` +
      `${msg.supporting_statistics || "None"}\n\n` +
      `## Business Insight\n` +
      `- **Observation**: ${msg.business_insight?.observation}\n` +
      `- **Reason**: ${msg.business_insight?.reason}\n` +
      `- **Impact**: ${msg.business_insight?.business_impact}\n` +
      `- **Recommendation**: ${msg.business_insight?.recommendation}\n` +
      `\n---\n*Generated by Smart CSV Data Analyst Agent. Execution time: ${msg.execution_time_ms}ms | Confidence: ${msg.confidence_score}*`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agent_response_${msg.detected_intent?.toLowerCase().replace(" ", "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Inline Custom Visual Renderer supporting thematic dashboard configs or standard chart aggregates (Feature 5 / 6)
  const renderInlineVisual = (chartData: any, selectedTool?: string) => {
    if (!chartData) return null;

    if (selectedTool === "theme_dashboard_generator") {
      const kpis = chartData.kpis || {};
      const theme = chartData.theme || "revenue";

      return (
        <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-900 w-full space-y-4 max-w-lg">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
            Inline AI Thematic Dashboard: {theme.toUpperCase()}
          </span>

          {/* Mini KPIs Row */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(kpis)
              .slice(0, 3)
              .map(([key, item]: any) => (
                <div
                  key={key}
                  className="bg-zinc-900/60 p-2.5 rounded border border-zinc-900 space-y-0.5"
                >
                  <span className="text-[8px] text-zinc-500 font-semibold uppercase block truncate">
                    {item.label}
                  </span>
                  <span className="text-[11px] font-bold text-white block truncate">
                    {item.value}
                  </span>
                </div>
              ))}
          </div>

          <div className="text-[9px] text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-900/50">
            To view fully interactive charting, check our{" "}
            <b>Executive Dashboard</b> portal.
          </div>
        </div>
      );
    }

    // Default SVG Aggregates Renderer
    if (!chartData.points) return null;
    const pts = chartData.points.slice(0, 8);
    const chartType = chartData.chart_type || "bar";

    const w = 400;
    const h = 180;
    const p = 30;

    const maxVal = Math.max(...pts.map((pt: any) => pt.value || pt.y || 0), 10);

    const getXy = (i: number, v: number) => {
      const x = p + (i / (pts.length - 1 || 1)) * (w - 2 * p);
      const y = h - p - (v / maxVal) * (h - 2 * p);
      return { x, y };
    };

    return (
      <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-900 w-full max-w-lg space-y-2">
        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
          Inline visual decision: {chartType.toUpperCase()} Chart
        </span>
        <div className="h-40 w-full flex items-center justify-center">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${w} ${h}`}
            className="overflow-visible"
          >
            {chartType === "bar" &&
              pts.map((pt: any, idx: number) => {
                const coords = getXy(idx, pt.value);
                const barW = (w - 2 * p) / (pts.length * 1.5);
                const barH = h - p - coords.y;
                return (
                  <rect
                    key={idx}
                    x={coords.x - barW / 2}
                    y={coords.y}
                    width={barW}
                    height={barH}
                    rx="1.5"
                    fill="#6366f1"
                    opacity="0.8"
                  />
                );
              })}

            {chartType === "line" && (
              <path
                d={pts
                  .map((pt: any, idx: number) => {
                    const coords = getXy(idx, pt.value);
                    return `${idx === 0 ? "M" : "L"} ${coords.x} ${coords.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
              />
            )}

            {chartType === "scatter" &&
              pts.map((pt: any, idx: number) => {
                const coords = getXy(idx, pt.y || pt.value);
                return (
                  <circle
                    key={idx}
                    cx={coords.x}
                    cy={coords.y}
                    r="4"
                    fill="#a855f7"
                  />
                );
              })}
          </svg>
        </div>
      </div>
    );
  };

  const activeDatasetName =
    datasets.find((d) => d.upload_id === selectedDatasetId)?.original_name ||
    "No CSV loaded";

  return (
    <div className="flex h-[calc(100vh-8.5rem)] max-w-7xl mx-auto border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/40 backdrop-blur-md animate-fadeIn">
      {/* Left Chat Console */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-900 bg-background/25">
        {/* Workspace selector header */}
        <div className="h-14 border-b border-zinc-900 px-4 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <Database size={14} className="text-indigo-400" />
            <select
              value={selectedDatasetId}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 font-semibold focus:outline-none max-w-[180px] sm:max-w-xs truncate"
            >
              <option value="">No dataset selected</option>
              {datasets.map((d) => (
                <option key={d.upload_id} value={d.upload_id}>
                  {d.original_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-rose-400 transition"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <span className="w-px h-4 bg-zinc-900"></span>

            <button
              onClick={() => setReasoningOpen(!reasoningOpen)}
              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 text-[10px]"
            >
              {reasoningOpen ? (
                <ChevronRight size={13} />
              ) : (
                <ChevronLeft size={13} />
              )}
              <span>Reasoning Panel</span>
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[90%] ${message.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  message.role === "user"
                    ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                    : "bg-indigo-600/10 border-indigo-500/20 text-indigo-400"
                }`}
              >
                {message.role === "user" ? (
                  <User size={14} />
                ) : (
                  <Bot size={14} />
                )}
              </div>

              <div className="space-y-2 max-w-full">
                <div
                  className={`rounded-xl p-3.5 text-xs leading-relaxed border ${
                    message.role === "user"
                      ? "bg-indigo-600/10 border-indigo-500/20 text-zinc-100"
                      : "bg-zinc-900/60 border-zinc-900 text-zinc-300"
                  }`}
                >
                  <div className="prose prose-invert prose-xs">
                    {message.content.split("**").map((part, index) =>
                      index % 2 === 1 ? (
                        <strong key={index} className="text-white font-bold">
                          {part}
                        </strong>
                      ) : (
                        part
                      ),
                    )}
                  </div>

                  {message.supporting_statistics && (
                    <div className="mt-3 pt-3 border-t border-zinc-900/60 text-[10px] text-zinc-400 space-y-1 overflow-x-auto">
                      <div className="font-semibold text-zinc-300 uppercase tracking-wider text-[9px] mb-1">
                        Supporting Metrics
                      </div>
                      <div className="prose prose-invert text-[10px] markdown-table">
                        {message.supporting_statistics}
                      </div>
                    </div>
                  )}

                  {/* Rendering custom inline visualization supporting dynamic dashboards */}
                  {message.chart_data &&
                    renderInlineVisual(
                      message.chart_data,
                      message.selected_tool,
                    )}
                </div>

                {message.role === "assistant" && message.content && (
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500 px-1">
                    <button
                      onClick={() => handleCopyText(message.content)}
                      className="flex items-center gap-1 hover:text-zinc-300 transition"
                    >
                      <Copy size={11} />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleExportMarkdown(message)}
                      className="flex items-center gap-1 hover:text-zinc-300 transition"
                    >
                      <Download size={11} />
                      <span>Export MD</span>
                    </button>
                    {message.execution_time_ms !== undefined && (
                      <span className="font-mono text-[9px] ml-auto">
                        Exec: {message.execution_time_ms}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loader Node Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Loader2 size={14} className="animate-spin" />
              </div>

              <div className="glass-panel p-3.5 rounded-xl border border-zinc-900/80 max-w-sm w-full space-y-3">
                <div className="flex items-center gap-2">
                  <Activity
                    size={13}
                    className="text-indigo-400 animate-pulse"
                  />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                    {executingNode
                      ? `Node: ${executingNode}`
                      : "Executing graph..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap bg-zinc-950/20 border-t border-zinc-900/60 shrink-0 select-none">
            <Sparkles size={11} className="text-indigo-400 animate-pulse" />
            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mr-1">
              Suggestions:
            </span>
            {suggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-3 border-t border-zinc-900 bg-zinc-950 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedDatasetId
                ? `Query analyst over '${activeDatasetName}'...`
                : "Select a dataset context to ask questions..."
            }
            className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 h-11 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-zinc-900/80 transition"
            disabled={loading || !selectedDatasetId}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !selectedDatasetId}
            className="w-11 h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition disabled:opacity-40 shadow-premium"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Right AI Reasoning Panel & Live Graph Visualizer */}
      <AnimatePresence>
        {reasoningOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:flex flex-col h-full bg-zinc-950/70 shrink-0 border-l border-zinc-900 overflow-y-auto custom-scrollbar p-5 space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Terminal size={15} className="text-indigo-400" />
              <h2 className="font-display font-semibold text-xs text-zinc-300 uppercase tracking-widest">
                AI Reasoning Console
              </h2>
            </div>

            {/* Workflow Graph Visualizer (Feature 10) */}
            <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-900 space-y-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Live LangGraph Workflow Visualizer
              </span>

              <div className="relative pl-6 space-y-4 border-l border-zinc-800">
                {graphNodesList.map((node, idx) => {
                  // Determine status styling
                  let status: "pending" | "active" | "completed" = "pending";

                  if (loading) {
                    if (activeNodeIndex !== null) {
                      if (idx < activeNodeIndex) status = "completed";
                      else if (idx === activeNodeIndex) status = "active";
                    }
                  } else if (activeReasoning) {
                    status = "completed";
                  }

                  const styleMap = {
                    pending: "border-zinc-800 text-zinc-600 bg-zinc-950",
                    active:
                      "border-indigo-500 text-indigo-400 bg-indigo-500/10 shadow-premium animate-pulse scale-105",
                    completed:
                      "border-emerald-500 text-emerald-400 bg-emerald-500/10",
                  };

                  return (
                    <div
                      key={node.id}
                      className="relative flex items-center justify-between gap-3 transition duration-300"
                    >
                      {/* Left Connected Bubble */}
                      <div
                        className={`absolute -left-[35px] w-6 h-6 rounded-full border flex items-center justify-center text-[10px] z-10 font-bold transition-all ${styleMap[status]}`}
                      >
                        {status === "completed" ? "✓" : node.icon}
                      </div>

                      <div className="space-y-0.5">
                        <span
                          className={`text-[10px] font-semibold block transition-colors ${status === "active" ? "text-indigo-400" : status === "completed" ? "text-zinc-200" : "text-zinc-500"}`}
                        >
                          {node.label}
                        </span>
                        {status === "active" && (
                          <span className="text-[8px] text-zinc-500 uppercase tracking-wider animate-pulse block">
                            Executing...
                          </span>
                        )}
                        {status === "completed" &&
                          activeReasoning?.workflow_trace && (
                            <span className="text-[8px] font-mono text-zinc-600">
                              Latency:{" "}
                              {activeReasoning.workflow_trace[
                                idx
                              ]?.execution_time_ms.toFixed(1)}
                              ms
                            </span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeReasoning && (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-3.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-900">
                    <span className="text-zinc-500 font-sans">
                      Active Target CSV
                    </span>
                    <span className="text-zinc-300 truncate max-w-[120px] font-bold">
                      {activeReasoning.dataset}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-900">
                    <span className="text-zinc-500 font-sans">
                      Identified Goal Intent
                    </span>
                    <span className="text-indigo-400 font-bold">
                      {activeReasoning.detected_intent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-900">
                    <span className="text-zinc-500 font-sans">
                      Node Tool Executed
                    </span>
                    <span className="text-cyan-400">
                      {activeReasoning.selected_tool}()
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-900">
                    <span className="text-zinc-500 font-sans">
                      Process Time
                    </span>
                    <span className="text-zinc-300 font-bold">
                      {activeReasoning.execution_time_ms} ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-900">
                    <span className="text-zinc-500 font-sans">
                      Confidence Index
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {activeReasoning.confidence_score * 100}%
                    </span>
                  </div>
                </div>

                {activeReasoning.insight && (
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                      <Award size={13} className="text-amber-500" />
                      <span>RECOMMENDATION ENGINE</span>
                    </h4>

                    <div className="space-y-3.5 text-[10px]">
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-sans">
                          Observation:
                        </span>
                        <p className="text-zinc-300 leading-normal font-sans">
                          {activeReasoning.insight.observation}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-sans">
                          Reasoning:
                        </span>
                        <p className="text-zinc-400 leading-normal font-sans">
                          {activeReasoning.insight.reason}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-sans">
                          Margin Impact:
                        </span>
                        <p className="text-zinc-400 leading-normal font-sans">
                          {activeReasoning.insight.business_impact}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-sans">
                          Action Plan:
                        </span>
                        <p className="text-indigo-300 leading-normal font-sans font-medium">
                          {activeReasoning.insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!activeReasoning && !loading && (
              <div className="flex flex-col items-center justify-center text-center py-10 text-zinc-600">
                <HelpCircle size={22} className="stroke-current" />
                <p className="text-[10px] max-w-[200px] mt-2 font-sans">
                  Query the AI analyst to trigger planning processes and render
                  node state variables here.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ChatPage;
