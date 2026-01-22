import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

// Check if we're running in a native Capacitor app
export const isNativeApp = () => Capacitor.isNativePlatform();

// Handle OAuth for native apps using the Browser plugin
export const handleNativeGoogleAuth = async () => {
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
  if (!isNativeApp()) return () => {};

  let listenerHandle: { remove: () => void } | null = null;

  App.addListener('appUrlOpen', async ({ url }) => {
    console.log('Deep link received:', url);
    
    // Check if this is an auth callback
    if (url.includes('auth-callback')) {
      // Close the browser
      await Browser.close();
      
      // Extract tokens from the URL if present
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
      
      onAuthCallback();
    }
  }).then(handle => {
    listenerHandle = handle;
  });

  return () => {
    listenerHandle?.remove();
  };
};
