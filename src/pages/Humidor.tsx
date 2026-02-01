import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { LitMatchDisplay } from "@/components/LitMatchRating";
import { Plus, Heart, Loader2, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface HumidorCigar {
  cigar_id: string;
  brand: string;
  line: string;
  vitola: string;
  avg_score: number | null;
  logs_count: number;
  last_smoked: string | null;
  is_favorite: boolean;
}

type FilterType = "all" | "favorites" | "wishlist";

export default function Humidor() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [cigars, setCigars] = useState<HumidorCigar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchHumidor();
  }, [authLoading, user, navigate]);

  const fetchHumidor = async () => {
    if (!user) return;

    try {
      // Fetch smoke logs
      const { data: logs, error: logsError } = await supabase
        .from("smoke_logs")
        .select(`
          cigar_id,
          overall_score,
          smoked_at,
          cigars(brand, line, vitola)
        `)
        .eq("user_id", user.id)
        .order("smoked_at", { ascending: false });

      if (logsError) throw logsError;

      // Fetch favorites
      const { data: favorites, error: favError } = await supabase
        .from("user_favorites")
        .select(`
          cigar_id,
          cigars(brand, line, vitola)
        `)
        .eq("user_id", user.id);

      if (favError) throw favError;

      const favoriteIds = new Set(favorites?.map((f) => f.cigar_id) || []);

      const cigarMap = new Map<string, HumidorCigar>();
      
      // Process smoke logs
      (logs || []).forEach((log) => {
        const cigar = log.cigars as { brand: string; line: string; vitola: string };
        if (!cigar) return;

        const existing = cigarMap.get(log.cigar_id);
        if (existing) {
          existing.logs_count += 1;
          existing.avg_score =
            ((existing.avg_score || 0) * (existing.logs_count - 1) + Number(log.overall_score)) /
            existing.logs_count;
        } else {
          cigarMap.set(log.cigar_id, {
            cigar_id: log.cigar_id,
            brand: cigar.brand,
            line: cigar.line,
            vitola: cigar.vitola,
            avg_score: Number(log.overall_score),
            logs_count: 1,
            last_smoked: log.smoked_at,
            is_favorite: favoriteIds.has(log.cigar_id),
          });
        }
      });

      // Add favorites that haven't been smoked yet (wishlist items)
      (favorites || []).forEach((fav) => {
        if (!cigarMap.has(fav.cigar_id)) {
          const cigar = fav.cigars as { brand: string; line: string; vitola: string };
          if (cigar) {
            cigarMap.set(fav.cigar_id, {
              cigar_id: fav.cigar_id,
              brand: cigar.brand,
              line: cigar.line,
              vitola: cigar.vitola,
              avg_score: null,
              logs_count: 0,
              last_smoked: null,
              is_favorite: true,
            });
          }
        }
      });

      setCigars(Array.from(cigarMap.values()));
    } catch (error) {
      console.error("Error fetching humidor:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (cigarId: string, currentlyFavorite: boolean) => {
    if (!user) return;

    if (currentlyFavorite) {
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("cigar_id", cigarId);
    } else {
      await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, cigar_id: cigarId });
    }

    setCigars((prev) =>
      prev.map((c) =>
        c.cigar_id === cigarId ? { ...c, is_favorite: !currentlyFavorite } : c
      )
    );
  };

  const filteredCigars = (() => {
    switch (filter) {
      case "favorites":
        return cigars.filter((c) => c.is_favorite && c.logs_count > 0);
      case "wishlist":
        return cigars.filter((c) => c.is_favorite && c.logs_count === 0);
      default:
        return cigars;
    }
  })();

  const wishlistCount = cigars.filter((c) => c.is_favorite && c.logs_count === 0).length;

  return (
    <AppLayout>
      <div className="py-5 space-y-5 px-1">
        <h1 className="font-display text-3xl font-semibold text-foreground px-2">
          My Humidor
        </h1>

        {/* Tab toggle */}
        <div className="flex gap-4 sm:gap-6 px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "text-sm font-medium transition-colors duration-200 whitespace-nowrap touch-manipulation py-2",
              filter === "all" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={cn(
              "text-sm font-medium transition-colors duration-200 whitespace-nowrap touch-manipulation py-2",
              filter === "favorites" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Smoked
          </button>
          <button
            onClick={() => setFilter("wishlist")}
            className={cn(
              "relative text-sm font-medium transition-colors duration-200 whitespace-nowrap touch-manipulation py-2",
              filter === "wishlist" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Wishlist
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-4 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>

        {/* Cigars list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCigars.length === 0 ? (
          <div className="card-glass flex flex-col items-center justify-center py-16 text-center mx-2">
            <div className="mb-4 rounded-full bg-charcoal-light p-5">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground">
              {filter === "favorites" ? "No favorites yet" : filter === "wishlist" ? "No wishlist items" : "Your humidor is empty"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground font-body max-w-[260px]">
              {filter === "favorites"
                ? "Save cigars you've smoked to see them here"
                : filter === "wishlist"
                ? "Save cigars from search to add to your wishlist"
                : "Start logging cigars to build your collection"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-2">
            {filteredCigars.map((cigar, index) => (
              <div
                key={cigar.cigar_id}
                className={cn(
                  "card-glass p-4 stagger-item",
                  cigar.logs_count === 0 && "border border-dashed border-primary/30"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => cigar.logs_count === 0 ? navigate(`/rate?cigarId=${cigar.cigar_id}`) : null}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-foreground leading-tight">
                        {cigar.brand} {cigar.line}
                      </h3>
                      {cigar.logs_count === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          Want to try
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-body mt-0.5">
                      {cigar.vitola}
                    </p>
                    
                    {cigar.logs_count > 0 ? (
                      <>
                        <div className="mt-3">
                          <LitMatchDisplay score={cigar.avg_score} size="sm" />
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground font-body">
                          {cigar.logs_count} log{cigar.logs_count !== 1 ? "s" : ""} •
                          Last smoked{" "}
                          {cigar.last_smoked && formatDistanceToNow(new Date(cigar.last_smoked), {
                            addSuffix: true,
                          })}
                        </p>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rate?cigarId=${cigar.cigar_id}`);
                        }}
                        className="mt-3 flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                      >
                        <Flame className="h-4 w-4" />
                        Rate this cigar
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(cigar.cigar_id, cigar.is_favorite)}
                    className={cn(
                      "rounded-full p-2 transition-all duration-300 like-button touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center",
                      cigar.is_favorite
                        ? "text-primary liked"
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-all",
                        cigar.is_favorite && "fill-primary"
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/rate")}
        className="fab"
        aria-label="Log a new cigar"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>
    </AppLayout>
  );
}
