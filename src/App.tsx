import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StartupDiagnostics } from "@/components/StartupDiagnostics";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Rate from "./pages/Rate";
import Humidor from "./pages/Humidor";
import MatchCigar from "./pages/MatchCigar";
import Club from "./pages/Club";
import Admin from "./pages/Admin";
import Install from "./pages/Install";
import Profile from "./pages/Profile";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StartupDiagnostics>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/rate" element={<Rate />} />
              <Route path="/match-cigar" element={<MatchCigar />} />
              <Route path="/humidor" element={<Humidor />} />
              <Route path="/club" element={<Club />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/install" element={<Install />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </StartupDiagnostics>
  </QueryClientProvider>
);

export default App;
