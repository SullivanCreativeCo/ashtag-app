import { supabase } from '@/integrations/supabase/client';

// Lazy load Capacitor modules to prevent crashes on startup
let Capacitor: typeof import('@capacitor/core').Capacitor | null = null;
let Browser: typeof import('@capacitor/browser').Browser | null = null;
let CapacitorApp: typeof import('@capacitor/app').App | null = null;

// Initialize Capacitor modules safely
const initCapacitor = async () => {
  try {
    if (!Capacitor) {
      const capacitorCore = await import('@capacitor/core');
      Capacitor = capacitorCore.Capacitor;
    }
    return true;
  } catch {
    return false;
  }
};

const initBrowser = async () => {
  try {
    if (!Browser) {
      const browserModule = await import('@capacitor/browser');
      Browser = browserModule.Browser;
    }
    return Browser;
  } catch {
    return null;
  }
};

const initApp = async () => {
  try {
    if (!CapacitorApp) {
      const appModule = await import('@capacitor/app');
      CapacitorApp = appModule.App;
    }
    return CapacitorApp;
  } catch {
    return null;
  }
};

// Check if we're running in a native Capacitor app
// IMPORTANT: This must be strict to avoid false positives on web/custom domains.
// On web, window.Capacitor may still exist from the npm package, but isNativePlatform() should be false.
export const isNativeApp = (): boolean => {
  try {
    // Prefer the already-loaded module if available
    if (Capacitor) {
      return Capacitor.isNativePlatform();
    }
    // Fallback: check if window.Capacitor exists AND reports native platform
    const windowCap = (window as any).Capacitor;
    if (windowCap && typeof windowCap.isNativePlatform === 'function') {
      return windowCap.isNativePlatform();
    }
    return false;
  } catch {
    return false;
  }
};

// Handle OAuth for native apps using the Browser plugin
export const handleNativeGoogleAuth = async () => {
  const browser = await initBrowser();
  if (!browser) {
    throw new Error('Browser plugin not available');
  }

  // Get the OAuth URL from Supabase
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'app.lovable.f5a9ea032a734da8aa016e381def1c2e://auth-callback',
      skipBrowserRedirect: true, // Don't redirect automatically
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  // Open the OAuth URL in the system browser
  await browser.open({ url: data.url });
};

// Set up deep link listener for OAuth callbacks
export const setupDeepLinkListener = (onAuthCallback: () => void) => {
  // Only set up listener if we're in a native app
  if (!isNativeApp()) {
    return () => {};
  }

  let listenerHandle: { remove: () => void } | null = null;
  let isSetup = false;
  let isCancelled = false;

  const setup = async () => {
    if (isSetup || isCancelled) return;
    isSetup = true;

    const app = await initApp();
    const browser = await initBrowser();

    if (!app || isCancelled) {
      return;
    }

    try {
      const handle = await app.addListener('appUrlOpen', async ({ url }) => {
        // Check if this is an auth callback
        if (url.includes('auth-callback')) {
          // Close the browser if available
          if (browser) {
            try {
              await browser.close();
            } catch {
              // Browser may already be closed
            }
          }

          // Extract tokens from the URL if present
          try {
            const urlObj = new URL(url);
            const accessToken = urlObj.searchParams.get('access_token');
            const refreshToken = urlObj.searchParams.get('refresh_token');

            // If we have tokens in URL params, set the session
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }

            // Also check for hash fragments (some OAuth flows use this)
            if (url.includes('#')) {
              const hashParams = new URLSearchParams(url.split('#')[1]);
              const hashAccessToken = hashParams.get('access_token');
              const hashRefreshToken = hashParams.get('refresh_token');

              if (hashAccessToken && hashRefreshToken) {
                await supabase.auth.setSession({
                  access_token: hashAccessToken,
                  refresh_token: hashRefreshToken,
                });
              }
            }
          } catch (e) {
            console.error('Error processing auth callback URL:', e);
          }

          onAuthCallback();
        }
      });

      // If cancelled during async setup, clean up immediately
      if (isCancelled) {
        handle.remove();
        return;
      }

      listenerHandle = handle;
    } catch (error) {
      console.error('Error setting up deep link listener:', error);
    }
  };

  // Run setup asynchronously
  setup();

  return () => {
    isCancelled = true;
    listenerHandle?.remove();
  };
};
