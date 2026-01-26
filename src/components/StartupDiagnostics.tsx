import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type ErrorState = {
  message: string;
  stack?: string;
  href?: string;
  ts: string;
};

const STORAGE_KEY = "ashtag_startup_error_v1";

function formatUnknownError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === "string") return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

function persistError(state: ErrorState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function readPersistedError(): ErrorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ErrorState) : null;
  } catch {
    return null;
  }
}

function clearPersistedError() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

class StartupErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (state: ErrorState) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const now = new Date();
    const state: ErrorState = {
      message: error.message || "Unknown error",
      stack: error.stack,
      href: typeof window !== "undefined" ? window.location.href : undefined,
      ts: now.toISOString(),
    };
    this.props.onError(state);
  }

  render() {
    return this.props.children;
  }
}

export function StartupDiagnostics({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<ErrorState | null>(() => readPersistedError());

  React.useEffect(() => {
    const onWindowError = (event: ErrorEvent) => {
      const now = new Date();
      const formatted = formatUnknownError(event.error ?? event.message);
      const state: ErrorState = {
        message: formatted.message || "Uncaught error",
        stack: formatted.stack,
        href: window.location.href,
        ts: now.toISOString(),
      };
      persistError(state);
      setError(state);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const now = new Date();
      const formatted = formatUnknownError(event.reason);
      const state: ErrorState = {
        message: formatted.message || "Unhandled promise rejection",
        stack: formatted.stack,
        href: window.location.href,
        ts: now.toISOString(),
      };
      persistError(state);
      setError(state);
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  const copy = async () => {
    if (!error) return;
    const payload = JSON.stringify(error, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // ignore
    }
  };

  const dismiss = () => {
    clearPersistedError();
    setError(null);
  };

  return (
    <StartupErrorBoundary
      onError={(state) => {
        persistError(state);
        setError(state);
      }}
    >
      {children}

      {error ? (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col p-4">
            <div className="mb-3">
              <h1 className="text-xl font-semibold text-foreground">Startup error</h1>
              <p className="text-sm text-muted-foreground">
                The app hit an error on launch. Copy this and send it to me.
              </p>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <Button type="button" onClick={copy}>
                Copy details
              </Button>
              <Button type="button" variant="secondary" onClick={dismiss}>
                Dismiss
              </Button>
            </div>

            <ScrollArea className="flex-1 rounded-md border bg-card p-3">
              <pre className="whitespace-pre-wrap break-words text-xs text-foreground">
                {JSON.stringify(error, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </div>
      ) : null}
    </StartupErrorBoundary>
  );
}
