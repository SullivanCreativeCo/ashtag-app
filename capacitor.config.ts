import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f5a9ea032a734da8aa016e381def1c2e',
  appName: 'ashtagapp',
  webDir: 'dist',
  plugins: {
    App: {
      // Deep link configuration for OAuth callbacks
    }
  }
};

export default config;
