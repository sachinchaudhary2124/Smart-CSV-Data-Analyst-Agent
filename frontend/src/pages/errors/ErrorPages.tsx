import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-fadeIn font-sans">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
        <AlertTriangle size={32} />
      </div>
      
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">404 - Page Not Found</h2>
        <p className="text-zinc-500 text-sm max-w-md">
          The requested page route does not exist or has been relocated to another workspace partition.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
        >
          <Home size={14} />
          <span>Back to Dashboard</span>
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
        >
          <RotateCcw size={14} />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};

export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-fadeIn font-sans">
      <div className="w-16 h-16 rounded-2xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <AlertTriangle size={32} />
      </div>
      
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-white tracking-tight">500 - Server Internal Error</h2>
        <p className="text-zinc-500 text-sm max-w-md">
          The backend service encountered a critical exception. Please check server logs and ensure virtual dependencies are installed.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
        >
          <RotateCcw size={14} />
          <span>Reload Page</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
        >
          <Home size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
export default NotFoundPage;
