'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from './PWAProvider';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return; // No cleanup needed when going offline
    }
    
    // We're online now - check if we were previously offline
    if (!wasOfflineRef.current) return;
    
    // Schedule showing reconnected message to avoid sync setState
    const showTimer = setTimeout(() => setShowReconnected(true), 0);
    const hideTimer = setTimeout(() => {
      setShowReconnected(false);
      wasOfflineRef.current = false;
    }, 3000);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isOnline]);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-[9998] mx-auto max-w-xs pointer-events-none"
        >
          <div
            className={`rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium ${
              isOnline
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Ligação restaurada</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Estás offline</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
