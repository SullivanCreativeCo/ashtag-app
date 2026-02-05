import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';

// Check if we're running in a native Capacitor app
// IMPORTANT: This must be strict to avoid false positives on web/custom domains.
// On web, window.Capacitor may still exist from the npm package, but isNativePlatform() should be false.
export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Handle OAuth for native apps using the Browser plugin
export const handleNativeGoogleAuth = async () => {
  // Verify we're on a native platform
  if (!isNativeApp()) {
    throw new Error('Native OAuth is only available in the mobile app');
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
  await Browser.open({ url: data.url });
};

// Set up deep link listener for OAuth callbacks
export const setupDeepLinkListener = (onAuthCallback: () => void) => {
  // Only set up listener if we're in a native app
  if (!isNativeApp()) {
    return () => {};
  }

  let listenerHandle: { remove: () => void } | null = null;
  let isCancelled = false;

  const setup = async () => {
    if (isCancelled) return;

    try {
      const handle = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        // Check if this is an auth callback
        if (url.includes('auth-callback')) {
          // Close the browser
          try {
            await Browser.close();
          } catch {
            // Browser may already be closed
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

  // Run setup
  setup();

  return () => {
    isCancelled = true;
    listenerHandle?.remove();
  };
};
