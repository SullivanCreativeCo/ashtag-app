import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { BugReportButton } from "./BugReportButton";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-16">
        {children}
      </main>
      {showNav && <BottomNav />}
      <BugReportButton />
    </div>
  );
}
