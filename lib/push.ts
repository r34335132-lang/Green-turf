import Constants from "expo-constants";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

export type PushPermissionResult = "granted" | "denied" | "skipped";

/** Pide permisos y guarda el token Expo en profiles.expo_push_token */
export async function registerPushTokenForCurrentUser(): Promise<PushPermissionResult> {
  if (Platform.OS === "web") return "skipped";

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

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "GREEN TURF",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    if (!Device.isDevice) return "skipped";

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return "denied";

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) return "skipped";

    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", user.id);

    if (error) {
      console.warn("[registerPushToken]", error.message);
      return "denied";
    }

    return "granted";
  } catch (e) {
    console.warn("[registerPushToken]", e);
    return "denied";
  }
}

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  channelId?: string;
};

/** Envía push vía API pública de Expo (funciona con app cerrada) */
export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string
): Promise<void> {
  const unique = [...new Set(tokens.filter((t) => t && t.startsWith("ExponentPushToken")))];
  if (unique.length === 0) return;

  const messages: ExpoPushMessage[] = unique.map((to) => ({
    to,
    title,
    body,
    sound: "default",
    channelId: "default",
  }));

  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[sendExpoPush]", res.status, text);
    }
  }
}

export async function getPushTokensForRoles(roles: string[]): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .in("role", roles)
    .not("expo_push_token", "is", null);

  if (error) {
    console.warn("[getPushTokensForRoles]", error.message);
    return [];
  }
  return (data || []).map((r) => r.expo_push_token as string).filter(Boolean);
}

export async function getPushTokensForUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .in("id", userIds)
    .not("expo_push_token", "is", null);

  if (error) return [];
  return (data || []).map((r) => r.expo_push_token as string).filter(Boolean);
}

export async function getClientPushTokens(): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .or("role.eq.cliente,role.is.null")
    .not("expo_push_token", "is", null);

  if (error) return [];
  return (data || []).map((r) => r.expo_push_token as string).filter(Boolean);
}

export async function notifyStaffPush(title: string, body: string) {
  const tokens = await getPushTokensForRoles(["admin", "vendedor"]);
  await sendExpoPush(tokens, title, body);
}

export async function notifyUserPush(userId: string, title: string, body: string) {
  const tokens = await getPushTokensForUserIds([userId]);
  await sendExpoPush(tokens, title, body);
}
