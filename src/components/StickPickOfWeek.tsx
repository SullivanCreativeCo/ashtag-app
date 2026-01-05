import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, MapPin, Flame, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import stickPickHero from "@/assets/stick-pick-hero.jpg";

interface Cigar {
  id: string;
  brand: string;
  line: string;
  vitola: string;
  size: string | null;
  wrapper: string | null;
  binder: string | null;
  filler: string | null;
  origin: string | null;
  strength_profile: string | null;
  image_url: string | null;
}

export function StickPickOfWeek() {
  const navigate = useNavigate();
  const [cigar, setCigar] = useState<Cigar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyPick();
  }, []);

  const fetchWeeklyPick = async () => {
    try {
      // Use the current week number as a seed for consistent weekly picks
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      );
      
      // Fetch all cigars and pick one based on week
      const { data, error } = await supabase
        .from("cigars")
        .select("*")
        .order("brand");

      if (error) throw error;

      if (data && data.length > 0) {
        // Use week number to deterministically pick a cigar
        const index = weekNumber % data.length;
        setCigar(data[index]);
      }
    } catch (error) {
      console.error("Error fetching weekly pick:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-2 mb-6">
        <div className="card-elevated p-5 skeleton-shimmer h-48 rounded-2xl" />
      </div>
    );
  }

  if (!cigar) return null;

  const strengthColors: Record<string, string> = {
    "Mild": "text-emerald-400",
    "Mild-Medium": "text-lime-400",
    "Medium": "text-amber-400",
    "Medium-Full": "text-orange-400",
    "Full": "text-red-400",
  };

  return (
    <div className="mx-2 mb-6 stagger-item">
      <div className="card-elevated overflow-hidden">
        {/* Hero image */}
        <div className="relative h-44 w-full overflow-hidden">
          <img 
            src={stickPickHero} 
            alt="Featured cigar" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          
          {/* Floating smoke wisps */}
          <div className="absolute bottom-8 right-16 w-8 h-8 rounded-full bg-gradient-to-t from-muted/30 to-transparent blur-sm animate-smoke-drift" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-6 right-24 w-6 h-6 rounded-full bg-gradient-to-t from-muted/25 to-transparent blur-sm animate-smoke-drift-alt" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-10 right-20 w-10 h-10 rounded-full bg-gradient-to-t from-muted/20 to-transparent blur-md animate-smoke-drift" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-4 right-12 w-5 h-5 rounded-full bg-gradient-to-t from-muted/35 to-transparent blur-sm animate-smoke-drift-alt" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-12 right-28 w-7 h-7 rounded-full bg-gradient-to-t from-muted/15 to-transparent blur-md animate-smoke-drift" style={{ animationDelay: '3s' }} />
          
          {/* Badge overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2 glass rounded-full px-3 py-1.5">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <span className="text-xs font-bold text-primary tracking-wide uppercase">
              Pick of the Week
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Cigar name */}
          <div>
            <h3 className="font-display text-2xl font-bold text-foreground leading-tight tracking-tight">
              {cigar.brand}
            </h3>
            <p className="text-lg text-primary font-semibold mt-0.5">{cigar.line}</p>
            <p className="text-sm text-muted-foreground mt-1">{cigar.vitola}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {cigar.origin && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origin</p>
                  <p className="text-foreground font-medium">{cigar.origin}</p>
                </div>
              </div>
            )}

            {cigar.strength_profile && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50">
                  <Flame className={cn("h-4 w-4", strengthColors[cigar.strength_profile] || "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Strength</p>
                  <p className={cn("font-medium", strengthColors[cigar.strength_profile] || "text-foreground")}>
                    {cigar.strength_profile}
                  </p>
                </div>
              </div>
            )}

            {cigar.wrapper && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Wrapper</p>
                  <p className="text-foreground font-medium truncate max-w-[120px]">{cigar.wrapper}</p>
                </div>
              </div>
            )}

            {cigar.size && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50">
                  <span className="text-xs font-bold text-muted-foreground">Size</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dimensions</p>
                  <p className="text-foreground font-medium">{cigar.size}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tobacco details */}
          {(cigar.binder || cigar.filler) && (
            <div className="pt-3 border-t border-border/30 space-y-2">
              {cigar.binder && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground/70">Binder:</span> {cigar.binder}
                </p>
              )}
              {cigar.filler && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground/70">Filler:</span> {cigar.filler}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <button 
            onClick={() => navigate(`/rate?cigarId=${cigar.id}`)}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary font-semibold text-sm transition-all duration-300 hover:from-primary/30 hover:to-primary/20 active:scale-[0.98]"
          >
            Rate This Cigar
          </button>
        </div>
      </div>
    </div>
  );
}
