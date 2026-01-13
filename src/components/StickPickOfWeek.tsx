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
  const [bandImageUrl, setBandImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyPick();
  }, []);

  const fetchWeeklyPick = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-weekly-pick");

      if (error) throw error;

      if (data?.cigar) {
        setCigar(data.cigar);
        setBandImageUrl(data.bandImageUrl);
      }
    } catch (error) {
      console.error("Error fetching weekly pick:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-3 mb-6">
        <div className="card-cinematic skeleton-shimmer h-[420px] rounded-2xl" />
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

  const heroImage = bandImageUrl || stickPickHero;

  return (
    <div className="mx-3 mb-6 stagger-item">
      <div className="card-cinematic overflow-hidden">
        {/* Cinematic hero image */}
        <div className="relative h-56 w-full overflow-hidden hero-image">
          <img 
            src={heroImage} 
            alt={`${cigar.brand} ${cigar.line}`} 
            className="h-full w-full object-cover"
          />
          <div className="hero-overlay" />
          
          {/* Smoke wisps */}
          <div className="absolute bottom-12 right-20 w-10 h-10 rounded-full bg-gradient-to-t from-smoke/20 to-transparent blur-md animate-smoke-drift" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-8 right-28 w-8 h-8 rounded-full bg-gradient-to-t from-smoke/15 to-transparent blur-sm animate-smoke-drift-alt" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-16 right-24 w-12 h-12 rounded-full bg-gradient-to-t from-smoke/10 to-transparent blur-lg animate-smoke-drift" style={{ animationDelay: '3s' }} />
          
          {/* Gold badge */}
          <div className="absolute top-4 left-4 badge-gold">
            <Sparkles className="h-3.5 w-3.5 animate-pulse-subtle" />
            <span>Pick of the Week</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 -mt-8 relative">
          {/* Cigar name - large & elegant */}
          <div>
            <h3 className="font-display text-3xl font-bold text-foreground leading-tight tracking-tight">
              {cigar.brand}
            </h3>
            <p className="text-xl text-primary font-display font-semibold mt-1">{cigar.line}</p>
            <p className="text-sm text-muted-foreground font-body mt-1">{cigar.vitola}</p>
          </div>

          {/* Details grid - muted, refined */}
          <div className="grid grid-cols-2 gap-4">
            {cigar.origin && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Origin</p>
                  <p className="text-sm text-foreground font-medium font-body">{cigar.origin}</p>
                </div>
              </div>
            )}

            {cigar.strength_profile && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                  <Flame className={cn("h-4 w-4", strengthColors[cigar.strength_profile] || "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Strength</p>
                  <p className={cn("text-sm font-medium font-body", strengthColors[cigar.strength_profile] || "text-foreground")}>
                    {cigar.strength_profile}
                  </p>
                </div>
              </div>
            )}

            {cigar.wrapper && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Wrapper</p>
                  <p className="text-sm text-foreground font-medium truncate max-w-[100px] font-body">{cigar.wrapper}</p>
                </div>
              </div>
            )}

            {cigar.size && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                  <span className="text-[10px] font-bold text-muted-foreground font-body">Size</span>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Dimensions</p>
                  <p className="text-sm text-foreground font-medium font-body">{cigar.size}</p>
                </div>
              </div>
            )}
          </div>

          {/* CTA Button - glowing gold */}
          <button 
            onClick={() => navigate(`/rate?cigarId=${cigar.id}`)}
            className="w-full py-3.5 rounded-xl btn-glow text-primary-foreground font-display font-semibold text-sm tracking-wide"
          >
            Rate This Cigar
          </button>
        </div>
      </div>
    </div>
  );
}
