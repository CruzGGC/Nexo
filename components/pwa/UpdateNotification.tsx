'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from './PWAProvider';
import { RefreshCw } from 'lucide-react';

export function UpdateNotification() {
  const { hasUpdate, updateServiceWorker } = usePWA();

  if (!hasUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-4 right-4 z-[9999] mx-auto max-w-md"
      >
        <div className="glass-card rounded-xl p-4 border border-[#00f3ff]/30 shadow-lg shadow-[#00f3ff]/10">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#00f3ff] to-[#bc13fe] flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                Nova versão disponível!
              </p>
              <p className="text-xs text-white/60">
                Atualiza para as últimas novidades.
              </p>
            </div>
            <button
              onClick={updateServiceWorker}
              className="flex-shrink-0 py-2 px-4 rounded-lg bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Atualizar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
