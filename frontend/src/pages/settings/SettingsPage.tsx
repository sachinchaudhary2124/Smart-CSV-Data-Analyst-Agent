import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle,
  Server,
  Settings,
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsPage: React.FC = () => {
  const [llmProvider, setLlmProvider] = useState('ollama');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [modelName, setModelName] = useState('llama3');
  const [theme, setTheme] = useState('glassmorphism');
  const [chartTheme, setChartTheme] = useState('neon');
  const [reportTemplate, setReportTemplate] = useState('executive');
  const [exportPreference, setExportPreference] = useState('json');
  const [autoSave, setAutoSave] = useState(true);
  const [conversationMemory, setConversationMemory] = useState(true);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load persisted settings from backend
  const fetchSettings = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8005/api/settings');
      if (res.ok) {
        const data = await res.json();
        setLlmProvider(data.llm_provider || 'ollama');
        setOllamaEndpoint(data.ollama_endpoint || 'http://localhost:11434');
        setModelName(data.model_name || 'llama3');
        setTheme(data.theme || 'glassmorphism');
        setChartTheme(data.chart_theme || 'neon');
        setReportTemplate(data.report_template || 'executive');
        setExportPreference(data.export_preference || 'json');
        setAutoSave(data.auto_save !== undefined ? data.auto_save : true);
        setConversationMemory(data.conversation_memory !== undefined ? data.conversation_memory : true);
      }
    } catch (err) {
      console.warn("Failed fetching user settings:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        llm_provider: llmProvider,
        ollama_endpoint: ollamaEndpoint,
        model_name: modelName,
        theme,
        chart_theme: chartTheme,
        report_template: reportTemplate,
        export_preference: exportPreference,
        auto_save: autoSave,
        conversation_memory: conversationMemory
      };

      const res = await fetch('http://127.0.0.1:8005/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToastMessage("Settings updated successfully!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed saving settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setLlmProvider('ollama');
    setOllamaEndpoint('http://localhost:11434');
    setModelName('llama3');
    setTheme('glassmorphism');
    setChartTheme('neon');
    setReportTemplate('executive');
    setExportPreference('json');
    setAutoSave(true);
    setConversationMemory(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-premium text-xs font-bold"
          >
            <CheckCircle size={15} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="text-indigo-400" size={24} />
            <span>SaaS Settings Control Center</span>
          </h1>
          <p className="text-zinc-500 text-sm">Configure language models, default visuals, export options, and workspace preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Columns: Inputs form */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Models */}
          <div className="glass-panel p-6 rounded-2xl space-y-5 border border-zinc-900/60">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Cpu size={16} className="text-indigo-400" />
              <span>Language Model Settings</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">LLM Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ollama">Ollama (Local LLM)</option>
                    <option value="openai">OpenAI (Cloud SaaS)</option>
                    <option value="anthropic">Anthropic (Cloud SaaS)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Model Name</label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="llama3">llama3 (8B default)</option>
                    <option value="mistral">mistral (7B model)</option>
                    <option value="phi3">phi3 (Small Context)</option>
                    <option value="gpt-4o">gpt-4o (OpenAI)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Ollama Endpoint URL</label>
                <div className="relative">
                  <Server className="absolute left-3 top-2.5 text-zinc-600" size={14} />
                  <input
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded pl-9 pr-4 py-2 text-xs text-zinc-300 focus:outline-none"
                    placeholder="http://localhost:11434"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User preferences */}
          <div className="glass-panel p-6 rounded-2xl space-y-5 border border-zinc-900/60">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Sliders size={16} className="text-indigo-400" />
              <span>Workspace Preferences</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Interface Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="glassmorphism">Glassmorphism (Neon)</option>
                  <option value="dark">Dark Minimal</option>
                  <option value="light">Classic Slate</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Default Chart Theme</label>
                <select
                  value={chartTheme}
                  onChange={(e) => setChartTheme(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="neon">Neon Glow</option>
                  <option value="classic">Classic Business</option>
                  <option value="vintage">Vintage Editorial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Report Template</label>
                <select
                  value={reportTemplate}
                  onChange={(e) => setReportTemplate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="executive">AI Executive Pitch</option>
                  <option value="standard">Analytical Review</option>
                  <option value="compact">Technical Abstract</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Export Preference</label>
                <select
                  value={exportPreference}
                  onChange={(e) => setExportPreference(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="json">JSON format</option>
                  <option value="csv">CSV format</option>
                </select>
              </div>
            </div>
          </div>

          {/* SaaS memory toggles */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-zinc-900/60 font-sans">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" />
              <span>Features Toggles</span>
            </h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-900">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">Enable Auto Save</span>
                <span className="text-[10px] text-zinc-500 block">Saves reports and workspace edits to storage.</span>
              </div>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-zinc-900 border-zinc-800 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-900">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">Conversation Memory</span>
                <span className="text-[10px] text-zinc-500 block">Retains conversational context across message sequences.</span>
              </div>
              <input
                type="checkbox"
                checked={conversationMemory}
                onChange={(e) => setConversationMemory(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-zinc-900 border-zinc-800 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Right Side: Action Box */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4 border border-zinc-900/60 bg-gradient-to-br from-zinc-900/25 to-zinc-950/10">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Settings Actions</h3>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-premium transition"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              <span>Save Configurations</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
export default SettingsPage;
