import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Database, 
  Activity, 
  User, 
  Menu,
  Home
} from 'lucide-react';

interface TopNavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  selectedDataset: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen,
  selectedDataset
}) => {
  const location = useLocation();
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  // Check backend health status periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8005/api/health');
        if (res.ok) {
          setBackendHealthy(true);
        } else {
          setBackendHealthy(false);
        }
      } catch (err) {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumbs = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Landing';
    
    // Capitalize first letter of path segments
    return path.split('/').map(segment => 
      segment.charAt(0).toUpperCase() + segment.slice(1)
    ).join(' / ');
  };

  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-400 hover:text-white transition md:hidden"
        >
          <Menu size={20} />
        </button>
        
        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-[14px]">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-xs">Analytics Workspace</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 font-medium font-display">{getBreadcrumbs()}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Active Dataset Widget */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 shadow-premium">
          <Database size={13} className="text-indigo-400" />
          <span className="text-zinc-500">Active CSV:</span>
          <span className="text-zinc-200 truncate max-w-[150px]">{selectedDataset || 'No dataset loaded'}</span>
        </div>

        {/* Backend health status badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
            backendHealthy === true 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : backendHealthy === false
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700/40'
          }`}>
            <Activity size={12} className={backendHealthy ? 'animate-pulse' : ''} />
            <span>API: {backendHealthy === true ? 'ONLINE' : backendHealthy === false ? 'OFFLINE' : 'CONNECTING'}</span>
          </div>
        </div>

        <span className="w-px h-6 bg-zinc-900"></span>

        {/* Action button: Go to landing page */}
        <Link 
          to="/" 
          title="Exit to Landing Page"
          className="p-2 rounded bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <Home size={16} />
        </Link>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-premium">
            <User size={15} />
          </div>
        </div>
      </div>
    </header>
  );
};
