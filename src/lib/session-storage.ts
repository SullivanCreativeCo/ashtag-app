// Session storage utility for "Remember this device" functionality

const REMEMBER_DEVICE_KEY = "ashtag_remember_device";

export const getRememberDevicePreference = (): boolean => {
  const stored = localStorage.getItem(REMEMBER_DEVICE_KEY);
  // Default to true if not set
  return stored === null ? true : stored === "true";
};

export const setRememberDevicePreference = (remember: boolean): void => {
  localStorage.setItem(REMEMBER_DEVICE_KEY, String(remember));
};

// Clear session if user doesn't want to be remembered
export const clearSessionIfNotRemembered = (): void => {
  const shouldRemember = getRememberDevicePreference();
  if (!shouldRemember) {
    // Session will be cleared on browser close via sessionStorage behavior
    // We mark this so the app knows to use sessionStorage-like behavior
    sessionStorage.setItem("ashtag_session_temporary", "true");
  }
};
