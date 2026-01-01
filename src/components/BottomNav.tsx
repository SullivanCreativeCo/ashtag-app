import { useLocation, useNavigate } from "react-router-dom";
import { Camera, Star, Archive, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Stick Pics",
    icon: Camera,
    path: "/feed",
  },
  {
    label: "Rate",
    icon: Star,
    path: "/rate",
  },
  {
    label: "My Humidor",
    icon: Archive,
    path: "/humidor",
  },
  {
    label: "Near Me",
    icon: MapPin,
    path: "/near-me",
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "nav-item flex-1 py-3",
                isActive && "active"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
