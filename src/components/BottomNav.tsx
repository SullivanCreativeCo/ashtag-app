import { useLocation, useNavigate } from "react-router-dom";
import { Camera, Flame, DoorOpen, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Stick Pics",
    icon: Camera,
    path: "/feed",
  },
  {
    label: "Rate",
    icon: Flame,
    path: "/rate",
  },
  {
    label: "Humidor",
    icon: DoorOpen,
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "nav-item flex-1",
                isActive && "active"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
                isActive ? "bg-primary/15 scale-110" : "hover:bg-muted/50"
              )}>
                <Icon
                  className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wide transition-all duration-300 mt-0.5",
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
