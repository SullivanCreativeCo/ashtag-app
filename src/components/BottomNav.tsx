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
    label: "My Humidor",
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
      <div className="mx-auto flex max-w-lg items-center justify-around py-1">
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
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide transition-colors",
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
