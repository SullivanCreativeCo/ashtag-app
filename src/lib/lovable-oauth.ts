const EXPECTED_MESSAGE_TYPE = "authorization_response";

type OAuthProvider = "google" | "apple";

type OAuthTokens = {
  access_token: string;
  refresh_token: string;
};

type OAuthResponse =
  | {
      access_token?: string;
      refresh_token?: string;
      state?: string;
      error?: string;
      error_description?: string;
    }
  | undefined;

// Lovable Cloud project UUID (safe to be public). Required by the hosted OAuth broker.
const LOVABLE_PROJECT_ID = "f5a9ea03-2a73-4da8-aa01-6e381def1c2e";

/**
 * Detect if we're running inside an iframe (e.g., Lovable preview).
 * Google blocks OAuth inside iframes, so we need different handling.
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe detection
    return true;
  }
}

function generateState() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return [...crypto.getRandomValues(new Uint8Array(16))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function startWebMessageListener({
  supportedOrigin,
}: {
  supportedOrigin: string;
}) {
  let resolvePromise: (value: OAuthResponse) => void;

  const messagePromise = new Promise<OAuthResponse>((resolve) => {
    resolvePromise = resolve;
  });

  const callback = (e: MessageEvent) => {
    if (e.origin !== supportedOrigin) return;

    const data = e.data as unknown;
    if (!data || typeof data !== "object") return;
    const payload = data as { type?: string; response?: OAuthResponse };
    if (payload.type !== EXPECTED_MESSAGE_TYPE) return;

    resolvePromise(payload.response as OAuthResponse);
  };

  window.addEventListener("message", callback);

  return {
    messagePromise,
    cleanup: () => window.removeEventListener("message", callback),
  };
}

/**
 * Web-only OAuth helper that avoids navigating to /~oauth/* on your domain.
 * It always uses the web_message + popup/new-tab flow.
 */
export async function signInWithLovableOAuthPopup(provider: OAuthProvider): Promise<
  | { tokens: OAuthTokens; error: null }
  | { tokens?: undefined; error: Error }
> {
  const oauthOrigin = "https://oauth.lovable.app";
  // NOTE: Lovable's hosted broker endpoint is `/initiate` (the older `/~oauth/initiate` now 404s).
  const oauthBrokerUrl = `${oauthOrigin}/initiate`;

  const state = generateState();
  const redirectUri = window.location.origin;

  const params = new URLSearchParams({
    provider,
    project_id: LOVABLE_PROJECT_ID,
    redirect_uri: redirectUri,
    state,
    response_mode: "web_message",
  });

  const url = `${oauthBrokerUrl}?${params.toString()}`;
  const { messagePromise, cleanup } = startWebMessageListener({ supportedOrigin: oauthOrigin });

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const popup = window.open(url, isMobile ? "_blank" : "oauth");

  if (!popup) {
    cleanup();
    return { error: new Error("Popup was blocked") };
  }

  let popupCheckInterval: number | undefined;
  const popupClosedPromise = new Promise<never>((_, reject) => {
    popupCheckInterval = window.setInterval(() => {
      if (popup.closed) {
        if (popupCheckInterval) window.clearInterval(popupCheckInterval);
        reject(new Error("Sign in was cancelled"));
      }
    }, 500);
  });

  try {
    const data = await Promise.race([messagePromise, popupClosedPromise]);

    if (!data) {
      return { error: new Error("No response received") };
    }

    if (data.error) {
      return { error: new Error(data.error_description ?? "Sign in failed") };
    }

    if (data.state !== state) {
      return { error: new Error("State is invalid") };
    }

    if (!data.access_token || !data.refresh_token) {
      return { error: new Error("No tokens received") };
    }

    return {
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      },
      error: null,
    };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  } finally {
    if (popupCheckInterval) window.clearInterval(popupCheckInterval);
    cleanup();
    // On mobile Safari the tab may be “_blank” and not closable; safe to try.
    try {
      popup.close();
    } catch {
      // ignore
    }
  }
}
