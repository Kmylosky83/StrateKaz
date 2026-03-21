import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

/**
 * Detect if running on iOS Safari (no native beforeinstallprompt)
 */
const getIsIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

/**
 * Detect if app is already installed (standalone mode)
 */
const getIsStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (getIsStandalone()) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const iosDetected = getIsIOS();
    setIsIOS(iosDetected);

    // iOS Safari: show educational banner (no native prompt available)
    if (iosDetected) {
      setShowIOSInstructions(true);
    }

    // Android/Desktop Chrome/Edge: intercept native prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowIOSInstructions(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show prompt after delay (subtle, not immediate)
    const timer = setTimeout(() => setIsReady(true), 15000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsInstallable(false);
    setShowIOSInstructions(false);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  }, []);

  // Only show when ready (after 15s delay) and not dismissed
  const shouldShow = isReady && !isInstalled && (isInstallable || showIOSInstructions);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showIOSInstructions,
    shouldShow,
    installApp,
    dismiss,
  };
};
