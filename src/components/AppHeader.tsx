import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ImageIcon } from "lucide-react";
import ashtagLogo from "@/assets/ashtag-logo.png";
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
    <header className="fixed left-0 right-0 top-0 z-50 glass safe-top">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <button 
          onClick={() => navigate("/feed")}
          className="flex items-center"
        >
          <img 
            src={ashtagLogo} 
            alt="AshTag - For the Ones Worth Repeating" 
            className="h-20 w-auto"
          />
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8 ring-2 ring-border/50">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass">
              {isAdmin && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate("/admin/band-images")}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Band Images
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="rounded-lg bg-primary px-4 py-2 font-display text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
