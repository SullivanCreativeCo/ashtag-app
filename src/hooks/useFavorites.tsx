import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_favorites")
      .select("cigar_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setFavorites(new Set(data.map(f => f.cigar_id)));
    }
    setLoading(false);
  };

  const toggleFavorite = useCallback(async (cigarId: string, cigarName?: string) => {
    if (!user) {
      toast.error("Sign in to save cigars to your humidor");
      return false;
    }

    const isFavorite = favorites.has(cigarId);

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(cigarId);
      } else {
        next.add(cigarId);
      }
      return next;
    });

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("cigar_id", cigarId);

        if (error) throw error;
        toast.success("Removed from humidor");
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, cigar_id: cigarId });

        if (error) throw error;
        toast.success(cigarName ? `${cigarName} saved to humidor!` : "Saved to humidor!");
      }
      return true;
    } catch (_error) {
      // Revert on error
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFavorite) {
          next.add(cigarId);
        } else {
          next.delete(cigarId);
        }
        return next;
      });
      toast.error("Failed to update favorites");
      return false;
    }
  }, [user, favorites]);

  const isFavorite = useCallback((cigarId: string) => {
    return favorites.has(cigarId);
  }, [favorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites,
  };
}
