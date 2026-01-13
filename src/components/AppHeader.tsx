import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ImageIcon } from "lucide-react";
import ashtagLogo from "@/assets/ashtag-logo-new.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 glass-nav safe-top">
      <div className="mx-auto flex h-20 max-w-lg items-center justify-between px-5">
        {/* Logo - large and prominent */}
        <button 
          onClick={() => navigate("/feed")}
          className="flex items-center"
        >
          <img 
            src={ashtagLogo} 
            alt="AshTag - For the Ones Worth Repeating" 
            className="h-36 w-auto"
          />
        </button>

        {/* Profile / Auth */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center outline-none transition-all duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full">
                <Avatar className="h-9 w-9 ring-2 ring-primary/40">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-charcoal-light text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 card-glass border-border/50">
              {isAdmin && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate("/admin/band-images")}
                    className="gap-2 cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Band Images
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                </>
              )}
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="btn-glow rounded-lg px-5 py-2 font-display text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
