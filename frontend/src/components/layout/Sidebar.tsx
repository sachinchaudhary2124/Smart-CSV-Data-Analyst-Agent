import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  UploadCloud, 
  MessageSquareCode, 
  BarChart3, 
  PieChart, 
  FileSpreadsheet, 
  Settings, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload CSV', path: '/upload', icon: UploadCloud },
    { name: 'AI Chat', path: '/chat', icon: MessageSquareCode },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Charts', path: '/charts', icon: PieChart },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Query History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <motion.aside
      initial={{ width: isOpen ? 260 : 76 }}
      animate={{ width: isOpen ? 260 : 76 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-y-0 left-0 z-50 flex flex-col bg-zinc-950 border-r border-zinc-900 overflow-hidden"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-900/60 bg-zinc-950">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-premium shadow-indigo-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-display font-semibold text-[15px] bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400"
            >
              CSV Analyst Agent
            </motion.span>
          )}
        </NavLink>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex w-6 h-6 rounded bg-zinc-900 border border-zinc-800 items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={() => `
                relative flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all group
                ${isActive 
                  ? 'text-white' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon 
                size={18} 
                className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} 
              />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="truncate"
                >
                  {item.name}
                </motion.span>
              )}
              
              {!isOpen && (
                <div className="absolute left-16 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300 opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-[100] shadow-premium">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 border-t border-zinc-900/60 bg-zinc-950/50 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Model Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-zinc-300">Ollama Ready</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 bg-zinc-900/60 rounded px-2 py-1 border border-zinc-800/40 font-mono">
            Model: llama3
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};
