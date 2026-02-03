import { useLocation, useNavigate } from "react-router-dom";
import { Flame, DoorOpen, Cigarette, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const baseNavItems = [
  {
    label: "Smoke",
    icon: Cigarette,
    path: "/feed",
  },
  {
    label: "Rate",
    icon: Flame,
    path: "/rate",
  },
  {
    label: "Save",
    icon: DoorOpen,
    path: "/humidor",
  },
];

const clubNavItem = {
  label: "Club",
  icon: Crown,
  path: "/club",
};

export function BottomNav() {
  // Show all nav items including Club to all users
  const navItems = [...baseNavItems, clubNavItem];
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "nav-item flex-1 touch-manipulation",
                isActive && "active"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                isActive ? "scale-110" : "hover:bg-muted/30"
              )}>
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-display font-semibold tracking-wider uppercase transition-all duration-300 select-none",
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
