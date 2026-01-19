import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface ApprovedCigar {
  id: string;
  requested_name: string;
  vitola: string | null;
  origin: string | null;
  wrapper: string | null;
  created_at: string;
  profile: {
    display_name: string | null;
  } | null;
}

export function NewCigarAdditions() {
  const navigate = useNavigate();
  const [approvedCigars, setApprovedCigars] = useState<ApprovedCigar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedCigars();
  }, []);

  const fetchApprovedCigars = async () => {
    try {
      // Only show cigars approved in the last 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data, error } = await supabase
        .from("cigar_requests")
        .select("id, requested_name, vitola, origin, wrapper, created_at, user_id")
        .eq("status", "approved")
        .gte("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch profiles for each requester
      const cigarsWithProfiles = await Promise.all(
        (data || []).map(async (cigar) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", cigar.user_id)
            .maybeSingle();

          return {
            ...cigar,
            profile,
          };
        })
      );

      setApprovedCigars(cigarsWithProfiles);
    } catch (error) {
      console.error("Error fetching approved cigars:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCigarClick = async (cigarName: string) => {
    // Find the cigar in the database and navigate to rate it
    const { data } = await supabase
      .from("cigars")
      .select("id")
      .ilike("line", `%${cigarName}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      navigate(`/rate?cigarId=${data.id}`);
    }
  };

  if (loading || approvedCigars.length === 0) {
    return null;
  }

  return (
    <div className="px-3">
      <div className="card-glass overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            New Additions
          </h3>
          <span className="text-xs text-muted-foreground font-body">
            Community submissions
          </span>
        </div>
        <div className="divide-y divide-border/20">
          {approvedCigars.map((cigar) => (
            <button
              key={cigar.id}
              onClick={() => handleCigarClick(cigar.requested_name)}
              className="w-full px-4 py-3 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-medium text-foreground truncate">
                  {cigar.requested_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {cigar.vitola && (
                    <span className="text-xs text-muted-foreground font-body">
                      {cigar.vitola}
                    </span>
                  )}
                  {cigar.origin && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground font-body">
                        {cigar.origin}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-primary font-body">
                  Added by {cigar.profile?.display_name || "Community Member"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}