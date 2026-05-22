import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";

import { registerPushTokenForCurrentUser } from "@/lib/push";
import { fetchMyProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const ASKED_KEY = "push_permission_asked_v1";

async function maybeAskPushPermission() {
  if (Platform.OS === "web") return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return;

  const already = await AsyncStorage.getItem(ASKED_KEY);
  if (already === "yes") {
    await registerPushTokenForCurrentUser();
    return;
  }
  if (already === "no") return;

  Alert.alert(
    "Activar notificaciones",
    "Recibe avisos de cotizaciones, promociones y mantenimiento aunque no tengas la app abierta.",
    [
      {
        text: "Ahora no",
        style: "cancel",
        onPress: async () => {
          await AsyncStorage.setItem(ASKED_KEY, "no");
        },
      },
      {
        text: "Activar",
        onPress: async () => {
          const result = await registerPushTokenForCurrentUser();
          await AsyncStorage.setItem(ASKED_KEY, result === "granted" ? "yes" : "no");
        },
      },
    ]
  );
}

export function usePushOnLogin() {
  const ranRef = useRef(false);

  useEffect(() => {
    async function onSession() {
      if (ranRef.current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || session.user.is_anonymous) return;

      await fetchMyProfile();
      ranRef.current = true;
      setTimeout(() => maybeAskPushPermission(), 800);
    }

    onSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user || session.user.is_anonymous) return;
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED"
      ) {
        await fetchMyProfile();
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          setTimeout(() => maybeAskPushPermission(), 600);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);
}

/** Para botón manual en Perfil */
export async function promptPushPermissionAgain() {
  await AsyncStorage.removeItem(ASKED_KEY);
  await maybeAskPushPermission();
}
