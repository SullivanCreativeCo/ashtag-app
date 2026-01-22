import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f5a9ea032a734da8aa016e381def1c2e',
  appName: 'ashtagapp',
  webDir: 'dist',
  server: {
    url: 'https://f5a9ea03-2a73-4da8-aa01-6e381def1c2e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    App: {
      // Deep link configuration for OAuth callbacks
    }
  }
};

export default config;
