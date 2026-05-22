import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  StaffNotification,
  getUnreadNotifications,
  markAllNotificationsRead,
  shouldListenStaffEvents,
  showLocalStaffAlert,
} from "@/lib/notifications";
import { fetchMyProfile, isStaffRole } from "@/lib/profile";
import { notifyStaffPush, registerPushTokenForCurrentUser } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type ToastPayload = { title: string; body: string } | null;

type StaffNotificationsContextType = {
  unreadCount: number;
  latestToast: ToastPayload;
  dismissToast: () => void;
  refreshUnread: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const StaffNotificationsContext = createContext<StaffNotificationsContextType | undefined>(
  undefined
);

export function StaffNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState<ToastPayload>(null);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const list = await getUnreadNotifications();
      setUnreadCount(list.length);
    } catch (e) {
      console.warn("[StaffNotifications] refresh", e);
    }
  }, [enabled]);

  const dismissToast = useCallback(() => setLatestToast(null), []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
  }, []);

  const handleNewNotification = useCallback(
    (row: StaffNotification) => {
      setUnreadCount((c) => c + 1);
      setLatestToast({ title: row.title, body: row.body });
      showLocalStaffAlert(row.title, row.body);
      notifyStaffPush(row.title, row.body);
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const profile = await fetchMyProfile();
      const ok = profile ? isStaffRole(profile.role) : await shouldListenStaffEvents();
      if (!mounted) return;
      setEnabled(ok);
      if (ok) {
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
      .channel("staff-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "staff_notifications",
        },
        (payload) => {
          const row = payload.new as StaffNotification;
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && row.recipient_id === user.id) {
              handleNewNotification(row);
            }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads_tracking" },
        () => refreshUnread()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "maintenance_requests" },
        (payload) => {
          const row = payload.new as { client_name?: string; description?: string };
          handleNewNotification({
            id: "",
            recipient_id: "",
            lead_id: null,
            title: "Mantenimiento solicitado",
            body: `${row.client_name || "Cliente"}: ${(row.description || "").slice(0, 60)}`,
            read_at: null,
            created_at: new Date().toISOString(),
          });
          refreshUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, handleNewNotification, refreshUnread]);

  return (
    <StaffNotificationsContext.Provider
      value={{
        unreadCount,
        latestToast,
        dismissToast,
        refreshUnread,
        markAllRead,
      }}
    >
      {children}
    </StaffNotificationsContext.Provider>
  );
}

export function useStaffNotifications() {
  const ctx = useContext(StaffNotificationsContext);
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
