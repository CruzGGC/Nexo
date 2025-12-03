'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { InstallPrompt } from './InstallPrompt';
import { UpdateNotification } from './UpdateNotification';
import { OfflineIndicator } from './OfflineIndicator';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  registration: ServiceWorkerRegistration | null;
  installPrompt: BeforeInstallPromptEvent | null;
  promptInstall: () => Promise<boolean>;
  updateServiceWorker: () => void;
  hasUpdate: boolean;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  // Initialize with actual value to avoid sync setState in effect
  const [isOnline, setIsOnline] = useState(() => 
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  // iOS detection (constant - detected once at mount)
  const isIOS = typeof window !== 'undefined' 
    ? /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !(window as unknown as { MSStream?: unknown }).MSStream
    : false;
  const [isStandalone, setIsStandalone] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported');
      return;
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        
        setRegistration(reg);
        console.log('[PWA] Service worker registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available');
              setHasUpdate(true);
              setWaitingWorker(newWorker);
            }
          });
        });

        // Check if there's already a waiting worker
        if (reg.waiting) {
          setHasUpdate(true);
          setWaitingWorker(reg.waiting);
        }

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    registerSW();

    // Handle controller change (when skipWaiting is called)
    // We track if a controller existed BEFORE the change to prevent refresh on first load
    let refreshing = false;
    const hadController = !!navigator.serviceWorker.controller;
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      // Only reload if there was a controller before this event (not first load)
      if (hadController) {
        console.log('[PWA] New service worker activated, reloading...');
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  // iOS detection is handled via lazy useState initialization above

  // Detect standalone mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = () => checkStandalone();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  // Handle online/offline status - initial value set via lazy useState
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Subscribe to online/offline events (no sync setState needed, initial value is set via useState)
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event captured');
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Prompt install
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setInstallPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [installPrompt]);

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  const value: PWAContextType = {
    isInstalled,
    isInstallable,
    isOnline,
    isIOS,
    isStandalone,
    registration,
    installPrompt,
    promptInstall,
    updateServiceWorker,
    hasUpdate,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      <InstallPrompt />
      <UpdateNotification />
      <OfflineIndicator />
    </PWAContext.Provider>
  );
}
