import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { BugReportButton } from "./BugReportButton";
import { usePresence } from "@/hooks/usePresence";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  const location = useLocation();
  
  // Track user presence with current page
  usePresence(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-24 safe-area-main">
        {children}
      </main>
      {showNav && <BottomNav />}
      <BugReportButton />
    </div>
  );
}
