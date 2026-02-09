/**
 * AGGRESSIVE CACHE KILLER - Auto-cleanup for corrupted Service Workers
 * This script runs BEFORE React loads to force clean browsers with stale cache
 * Version: 2.0.0 - Deployment Date: 2025-09-29
 */

(function() {
  'use strict';

  const CURRENT_VERSION = '2.0.0';
  const VERSION_KEY = 'stratekaz_site_version';
  const FORCE_RELOAD_KEY = 'stratekaz_force_reloaded';

  console.log('[Cache Killer] Checking for stale cache...');

  // Check stored version
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const hasReloaded = sessionStorage.getItem(FORCE_RELOAD_KEY);

  // If version mismatch and haven't reloaded yet this session
  if (storedVersion !== CURRENT_VERSION && !hasReloaded) {
    console.warn('[Cache Killer] Version mismatch detected!', {
      stored: storedVersion,
      current: CURRENT_VERSION
    });

    // Mark that we're about to reload (prevent infinite loop)
    sessionStorage.setItem(FORCE_RELOAD_KEY, 'true');

    // Aggressive cleanup function
    async function nukeCache() {
      console.log('[Cache Killer] Starting aggressive cleanup...');

      // 1. Unregister ALL service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log(`[Cache Killer] Found ${registrations.length} service worker(s)`);

          for (const registration of registrations) {
            await registration.unregister();
            console.log('[Cache Killer] Unregistered service worker:', registration.scope);
          }
        } catch (error) {
          console.error('[Cache Killer] Service worker cleanup failed:', error);
        }
      }

      // 2. Clear ALL caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          console.log(`[Cache Killer] Found ${cacheNames.length} cache(s):`, cacheNames);

          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('[Cache Killer] Deleted cache:', cacheName);
          }
        } catch (error) {
          console.error('[Cache Killer] Cache deletion failed:', error);
        }
      }

      // 3. Clear localStorage (except version flag)
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key !== VERSION_KEY && key !== FORCE_RELOAD_KEY) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[Cache Killer] Cleared ${keysToRemove.length} localStorage items`);
      } catch (error) {
        console.error('[Cache Killer] localStorage cleanup failed:', error);
      }

      // 4. Update version
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

      // 5. Force hard reload
      console.log('[Cache Killer] Forcing hard reload in 500ms...');
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    }

    // Execute cleanup
    nukeCache().catch(err => {
      console.error('[Cache Killer] Critical error:', err);
      // Still reload even if cleanup fails
      setTimeout(() => window.location.reload(true), 1000);
    });

  } else if (storedVersion === CURRENT_VERSION) {
    console.log('[Cache Killer] Version OK - no cleanup needed');
  } else if (hasReloaded) {
    console.log('[Cache Killer] Already reloaded this session');
    // Update version on successful reload
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  }
})();