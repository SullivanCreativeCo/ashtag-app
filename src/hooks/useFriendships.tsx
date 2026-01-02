import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useFriendships() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all friendships where user is involved
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Get friend profiles
      const friendshipsWithProfiles = await Promise.all(
        (data || []).map(async (friendship) => {
          const friendId = friendship.requester_id === user.id 
            ? friendship.addressee_id 
            : friendship.requester_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", friendId)
            .maybeSingle();

          return {
            ...friendship,
            friend: profile,
          };
        })
      );

      // Categorize friendships
      const accepted = friendshipsWithProfiles.filter(f => f.status === "accepted");
      const pending = friendshipsWithProfiles.filter(
        f => f.status === "pending" && f.addressee_id === user.id
      );
      const sent = friendshipsWithProfiles.filter(
        f => f.status === "pending" && f.requester_id === user.id
      );

      setFriends(accepted);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error("Error fetching friendships:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    });

    if (!error) await fetchFriendships();
    return { error };
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (!error) await fetchFriendships();
    return { error };
  };

  const declineFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "declined" })
      .eq("id", friendshipId);

    if (!error) await fetchFriendships();
    return { error };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (!error) await fetchFriendships();
    return { error };
  };

  const getFriendshipStatus = (userId: string): "none" | "pending_sent" | "pending_received" | "friends" => {
    const friendship = [...friends, ...pendingRequests, ...sentRequests].find(
      f => f.friend?.id === userId
    );
    
    if (!friendship) return "none";
    if (friendship.status === "accepted") return "friends";
    if (friendship.requester_id === user?.id) return "pending_sent";
    return "pending_received";
  };

  const getFriendIds = () => friends.map(f => f.friend?.id).filter(Boolean) as string[];

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendshipStatus,
    getFriendIds,
    refetch: fetchFriendships,
  };
}
