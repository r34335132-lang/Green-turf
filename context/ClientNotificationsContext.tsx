import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ClientNotification,
  getUnreadClientCount,
  markAllClientNotificationsRead,
  showClientLocalAlert,
} from "@/lib/clientNotifications";
import { fetchMyProfile, isStaffRole } from "@/lib/profile";
import { notifyUserPush, registerPushTokenForCurrentUser } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type ToastPayload = { title: string; body: string } | null;

type Ctx = {
  unreadCount: number;
  latestToast: ToastPayload;
  dismissToast: () => void;
  refreshUnread: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const ClientNotificationsContext = createContext<Ctx | undefined>(undefined);

export function ClientNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState<ToastPayload>(null);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      setUnreadCount(await getUnreadClientCount());
    } catch {
      /* tabla puede no existir aún */
    }
  }, [enabled]);

  const dismissToast = useCallback(() => setLatestToast(null), []);

  const markAllRead = useCallback(async () => {
    await markAllClientNotificationsRead();
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user || user.is_anonymous) return;
      const profile = await fetchMyProfile();
      const isClient = profile ? !isStaffRole(profile.role) : true;
      if (!mounted) return;
      setEnabled(isClient);
      if (isClient) {
        await registerPushTokenForCurrentUser();
        await refreshUnread();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshUnread]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("client-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_notifications" },
        (payload) => {
          const row = payload.new as ClientNotification;
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && row.user_id === user.id) {
              setUnreadCount((c) => c + 1);
              setLatestToast({ title: row.title, body: row.body });
              showClientLocalAlert(row.title, row.body);
              notifyUserPush(user.id, row.title, row.body);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return (
    <ClientNotificationsContext.Provider
      value={{ unreadCount, latestToast, dismissToast, refreshUnread, markAllRead }}
    >
      {children}
    </ClientNotificationsContext.Provider>
  );
}

export function useClientNotifications() {
  const ctx = useContext(ClientNotificationsContext);
  if (!ctx) {
    return {
      unreadCount: 0,
      latestToast: null,
      dismissToast: () => {},
      refreshUnread: async () => {},
      markAllRead: async () => {},
    };
  }
  return ctx;
}
