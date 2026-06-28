import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  trend: 'up' | 'down';
  label: string;
}

interface FilterOptions {
  categories: string[];
  regions: string[];
  products: string[];
}

export const DashboardHome: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  // Dashboard view mode: 'standard' | 'theme'
  const [dashboardMode, setDashboardMode] = useState<'standard' | 'theme'>('standard');
  const [themeName, setThemeName] = useState<string>('');
  const [themeWidgets, setThemeWidgets] = useState<any[]>([]);
  
  // KPI card metrics state
  const [kpis, setKpis] = useState<Record<string, KPICardDetails> | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({ categories: [], regions: [], products: [] });
  
  // Active selected filters
  const [selCategory, setSelCategory] = useState('');
  const [selRegion, setSelRegion] = useState('');
  const [selProduct, setSelProduct] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch datasets list
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8005/api/upload/recent');
        if (res.ok) {
          const data = await res.json();
          setDatasets(data);
          
          // Fetch active dataset from backend
          const activeRes = await fetch('http://127.0.0.1:8005/api/upload/active');
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
        console.warn("Failed fetching datasets list:", err);
      }
    };
    fetchDatasets();
  }, []);

  const handleDatasetChange = async (id: string) => {
    setSelectedDatasetId(id);
    handleResetFilters();
    try {
      await fetch(`http://127.0.0.1:8005/api/upload/active/${id}`, { method: 'POST' });
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
        let url = `http://127.0.0.1:8005/api/analytics/overview/${selectedDatasetId}`;
        const params: string[] = [];
        if (selCategory) params.push(`category=${encodeURIComponent(selCategory)}`);
        if (selRegion) params.push(`region=${encodeURIComponent(selRegion)}`);
        if (selProduct) params.push(`product=${encodeURIComponent(selProduct)}`);
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setKpis(data);
          if (data.filters) {
            setFilters(data.filters);
          }
        }
      } catch (err) {
        console.error("Failed fetching overview KPIs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (dashboardMode === 'standard') {
      fetchOverview();
    }
  }, [selectedDatasetId, selCategory, selRegion, selProduct, dashboardMode]);

  // Handle AI Thematic Dashboard Generator Query
  const handleAIBuildDashboard = async (queryText: string) => {
    if (!selectedDatasetId || !queryText.trim()) return;
    
    setLoading(true);
    let theme = 'revenue';
    const q = queryText.toLowerCase();
    if (q.includes('sale') || q.includes('order') || q.includes('volume')) {
      theme = 'sales';
    } else if (q.includes('finance') || q.includes('profit') || q.includes('margin')) {
      theme = 'finance';
    } else if (q.includes('marketing') || q.includes('lead') || q.includes('campaign')) {
      theme = 'marketing';
    }

    try {
      const res = await fetch(`http://127.0.0.1:8005/api/analytics/theme/${selectedDatasetId}?theme=${theme}`);
      if (res.ok) {
        const data = await res.json();
        setThemeWidgets(data.widgets);
        setKpis(data.kpis);
        setThemeName(data.theme);
        setDashboardMode('theme');
      }
    } catch (err) {
      console.error("Failed loading theme layout:", err);
    } finally {
      setLoading(false);
      setSearchQuery('');
    }
  };

  const handleResetFilters = () => {
    setSelCategory('');
    setSelRegion('');
    setSelProduct('');
    setDashboardMode('standard');
  };

  // KPI icon map
  const getIcon = (key: string) => {
    switch (key) {
      case 'revenue': return DollarSign;
      case 'orders': return ShoppingCart;
      case 'growth': return Percent;
      case 'profit': return Activity;
      case 'aov': return Layers;
      case 'top_product': return Award;
      case 'worst_product': return AlertCircle;
      case 'top_region': return Globe;
      case 'top_category': return Tag;
      case 'peak_month': return Calendar;
      case 'lowest_month': return Calendar;
      default: return TrendingUp;
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' }
    })
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
          <p className="text-zinc-500 text-sm">Real-time dynamic corporate analytics generated from physical CSV models.</p>
        </div>

        {/* AI Dashboard Builder input bar */}
        <div className="flex items-center gap-3 w-full lg:w-auto max-w-md">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={15} />
            <input
              type="text"
              placeholder="e.g. Create sales dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAIBuildDashboard(searchQuery);
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
          <span className="text-xs text-zinc-400 font-semibold">Active Context:</span>
          <select
            value={selectedDatasetId}
            onChange={(e) => handleDatasetChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-medium cursor-pointer focus:outline-none"
          >
            {datasets.map(d => (
              <option key={d.upload_id} value={d.upload_id}>{d.original_name}</option>
            ))}
          </select>
        </div>

        {dashboardMode === 'standard' ? (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <SlidersHorizontal size={13} className="text-zinc-500" />
            
            <select
              value={selCategory}
              onChange={(e) => setSelCategory(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Category (All)</option>
              {filters.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selRegion}
              onChange={(e) => setSelRegion(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Region (All)</option>
              {filters.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={selProduct}
              onChange={(e) => setSelProduct(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Product (All)</option>
              {filters.products.map(p => <option key={p} value={p}>{p}</option>)}
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
                setDashboardMode('standard');
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
            <div key={i} className="h-28 bg-zinc-900 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : kpis ? (
        <div className="space-y-8">
          
          {/* Dashboard Title / Sub-section */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              {dashboardMode === 'standard' ? 'Operational Health & KPIs Matrix' : `${themeName.toUpperCase()} Thematic Insights Grid`}
            </h3>
            {dashboardMode === 'theme' && (
              <span className="text-[10px] text-zinc-500 font-medium">Layout compiled automatically in 240ms</span>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(kpis).map(([key, details], i) => {
              if (key === 'filters') return null; // skip filter payload object
              const Icon = getIcon(key);
              
              // Custom themes gradient map
              const colorMaps: Record<string, string> = {
                revenue: "from-indigo-600/10 to-indigo-500/5 hover:border-indigo-500/30 text-indigo-400",
                orders: "from-cyan-600/10 to-cyan-500/5 hover:border-cyan-500/30 text-cyan-400",
                growth: "from-sky-600/10 to-sky-500/5 hover:border-sky-500/30 text-sky-400",
                profit: "from-emerald-600/10 to-emerald-500/5 hover:border-emerald-500/30 text-emerald-400",
                aov: "from-amber-600/10 to-amber-500/5 hover:border-amber-500/30 text-amber-400",
                top_product: "from-purple-600/10 to-purple-500/5 hover:border-purple-500/30 text-purple-400",
                top_region: "from-teal-600/10 to-teal-500/5 hover:border-teal-500/30 text-teal-400",
                top_category: "from-pink-600/10 to-pink-500/5 hover:border-pink-500/30 text-pink-400"
              };
              
              const gradStyle = colorMaps[key] || "from-zinc-900/40 to-zinc-950/20 hover:border-zinc-800 text-zinc-400";
              const isUp = details.trend === 'up';

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
                      <h4 className="text-base lg:text-lg font-bold text-zinc-100 tracking-tight truncate max-w-[170px]" title={details.value}>
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
                    <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {details.change}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Render Thematic Widgets if theme dashboard is loaded */}
          {dashboardMode === 'theme' && themeWidgets.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Thematic Widgets Grid</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {themeWidgets.map((widget, widx) => {
                  if (widget.type === 'chart') {
                    return (
                      <div key={widx} className="glass-panel p-5 rounded-2xl border border-zinc-900 md:col-span-1 space-y-4">
                        <span className="text-xs font-semibold text-zinc-400">{widget.title}</span>
                        <div className="h-40 flex items-center justify-center bg-zinc-950/40 rounded-lg border border-zinc-900/60 text-zinc-500 text-[11px]">
                          [Dynamic thematic chart: {widget.chart_type.toUpperCase()} on X: {widget.x_axis} | Y: {widget.y_axis}]
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
            <h3 className="text-sm font-semibold text-zinc-400">Platform Ready for Ingestion</h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Please upload a CSV dataset file inside the upload portal to calculate the operational dashboard metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardHome;
