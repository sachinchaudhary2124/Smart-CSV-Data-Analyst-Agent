import React, { useState, useEffect } from "react";
import { WifiOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../services/api";

export const ConnectionLostAlert: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.get("/health", { signal: AbortSignal.timeout(5000) });
        setIsOffline(false);
      } catch (err) {
        setIsOffline(true);
      }
    };

    // Poll server health status every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 inset-x-0 z-[100] bg-rose-600 text-white py-2.5 px-4 flex items-center justify-center gap-3 shadow-md font-sans text-xs font-bold"
        >
          <WifiOff size={15} className="animate-pulse" />
          <span>
            Connection to FastAPI server lost. Retrying backend sync...
          </span>
          <Loader2 size={13} className="animate-spin ml-2" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
