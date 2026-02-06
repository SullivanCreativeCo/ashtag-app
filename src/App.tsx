import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StartupDiagnostics } from "@/components/StartupDiagnostics";
import { isNativeApp } from "@/lib/capacitor-auth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Rate from "./pages/Rate";
import Humidor from "./pages/Humidor";
import MatchCigar from "./pages/MatchCigar";
import Club from "./pages/Club";
import Admin from "./pages/Admin";
import Install from "./pages/Install";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle landing page - redirects native apps to auth/feed
const LandingRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If user landed on root with a password-recovery hash (e.g. from email link),
  // send them to /auth so the Auth page can show "Set new password"
  if (location.pathname === "/" && typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
    return <Navigate to={"/auth?reset=true" + window.location.hash} replace />;
  }

  // If user landed on root with ?reset=true (broker may have redirected here), send to /auth so they can set a new password
  if (location.pathname === "/" && typeof window !== "undefined" && location.search.includes("reset=true")) {
    const to = "/auth" + location.search + window.location.hash;
    return <Navigate to={to} replace />;
  }

  // If user landed with an expired/invalid reset link (e.g. otp_expired from email),
  // send them to /auth with a clear error so they can request a new link
  if (location.pathname === "/" && typeof window !== "undefined") {
    const hash = window.location.hash;
    if (hash.includes("error_code=otp_expired") || hash.includes("error=access_denied")) {
      return <Navigate to="/auth?reset_error=expired" replace />;
    }
  }

  // If user just clicked the password-reset email link but broker sent them to root, never show landing — redirect to set-new-password
  if (location.pathname === "/" && user && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("pendingPasswordReset");
      if (raw) {
        const ts = parseInt(raw, 10);
        if (!Number.isNaN(ts) && Date.now() - ts <= 60 * 60 * 1000) {
          localStorage.removeItem("pendingPasswordReset");
          window.location.replace("/auth?reset=true");
          return (
            <div className="flex min-h-screen items-center justify-center bg-background">
              <p className="text-muted-foreground">Taking you to set your new password…</p>
            </div>
          );
        }
        localStorage.removeItem("pendingPasswordReset");
      }
    } catch {
      /* ignore */
    }
  }

  // On native apps, skip the landing page entirely
  if (isNativeApp()) {
    // If logged in, go to feed; otherwise go to auth
    if (loading) return null; // Wait for auth state
    return <Navigate to={user ? "/feed" : "/auth"} replace />;
  }

  // On web, show the landing page
  return <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StartupDiagnostics>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingRoute />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/rate" element={<Rate />} />
              <Route path="/match-cigar" element={<MatchCigar />} />
              <Route path="/humidor" element={<Humidor />} />
              <Route path="/club" element={<Club />} />
              <Route path="/profile/setup" element={<ProfileSetup />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/install" element={<Install />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </StartupDiagnostics>
  </QueryClientProvider>
);

export default App;
