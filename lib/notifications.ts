import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import { isStaffRole } from "@/lib/staff";

export type StaffNotification = {
  id: string;
  recipient_id: string;
  lead_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export async function getUnreadNotifications(): Promise<StaffNotification[]> {
  const { data, error } = await supabase
    .from("staff_notifications")
    .select("*")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as StaffNotification[]) || [];
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("staff_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) console.error("[markAllNotificationsRead]", error.message);
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("staff_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("[markNotificationRead]", error.message);
}

export async function setupPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (!Device.isDevice) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    return (await Notifications.getExpoPushTokenAsync()).data;
  } catch (e) {
    console.warn("[setupPushNotifications]", e);
    return null;
  }
}

export async function showLocalStaffAlert(title: string, body: string) {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    // in-app toast handles UI if push module unavailable
  }
}

export async function shouldListenStaffEvents(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return isStaffRole(data?.role || "");
}
