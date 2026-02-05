// Check if we're running in a native Capacitor app
export const isNativeApp = (): boolean => {
  try {
    // Check if window.Capacitor exists AND reports native platform
    const windowCap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (windowCap && typeof windowCap.isNativePlatform === 'function') {
      return windowCap.isNativePlatform();
    }
    return false;
  } catch {
    return false;
  }
};
