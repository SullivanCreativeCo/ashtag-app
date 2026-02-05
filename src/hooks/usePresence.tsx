import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  user_id: string;
  email?: string;
  display_name?: string;
  online_at: string;
  current_page?: string;
}

interface UsePresenceReturn {
  onlineUsers: PresenceState[];
  onlineCount: number;
  isConnected: boolean;
}

export function usePresence(currentPage?: string): UsePresenceReturn {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel("app_presence", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: PresenceState[] = [];
        
        Object.values(state).forEach((presences) => {
          if (Array.isArray(presences)) {
            presences.forEach((presence: unknown) => {
              const p = presence as Record<string, unknown>;
              if (p.user_id && p.online_at) {
                users.push(p as unknown as PresenceState);
              }
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, () => {
        // User joined - presence sync handles state updates
      })
      .on("presence", { event: "leave" }, () => {
        // User left - presence sync handles state updates
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          
          // Track this user's presence
          await presenceChannel.track({
            user_id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name,
            online_at: new Date().toISOString(),
            current_page: currentPage,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
      setIsConnected(false);
    };
  }, [user]);

  // Update current page when it changes
  useEffect(() => {
    if (channel && user && isConnected && currentPage) {
      channel.track({
        user_id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name,
        online_at: new Date().toISOString(),
        current_page: currentPage,
      });
    }
  }, [currentPage, channel, user, isConnected]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isConnected,
  };
}
