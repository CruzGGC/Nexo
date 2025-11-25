'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from './PWAProvider';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has dismissed the prompt before
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }
  }, []);

  // Show prompt after a delay if installable
  useEffect(() => {
    if (isDismissed || isInstalled || isStandalone) return;
    if (!isInstallable && !isIOS) return;

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [isInstallable, isIOS, isDismissed, isInstalled, isStandalone]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowPrompt(false);
    }
  };

  // Don't render if already installed or in standalone mode
  if (isInstalled || isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          
          {/* Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md"
          >
            <div className="glass-card rounded-2xl p-6 border border-white/10">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              {/* Content */}
              <div className="flex items-start gap-4">
                {/* App Icon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f3ff] to-[#bc13fe] flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-black text-white">N</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Instalar Nexo
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    Adiciona ao ecrã inicial para uma experiência mais rápida!
                  </p>

                  {isIOS ? (
                    // iOS Install Instructions
                    <div className="space-y-3">
                      <p className="text-xs text-white/50">
                        Para instalar no iOS:
                      </p>
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400">
                          1
                        </span>
                        <span className="flex items-center gap-2">
                          Toca em <Share className="w-4 h-4 text-blue-400" />
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400">
                          2
                        </span>
                        <span className="flex items-center gap-2">
                          Seleciona <Plus className="w-4 h-4 text-blue-400" /> "Ecrã principal"
                        </span>
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="w-full mt-4 py-3 px-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                      >
                        Entendido
                      </button>
                    </div>
                  ) : (
                    // Android/Desktop Install Button
                    <div className="flex gap-3">
                      <button
                        onClick={handleInstall}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black font-bold hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-5 h-5" />
                        Instalar
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="py-3 px-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                      >
                        Agora não
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-6 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Acesso rápido
                </span>
                <span>•</span>
                <span>Funciona offline</span>
                <span>•</span>
                <span>Notificações</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
