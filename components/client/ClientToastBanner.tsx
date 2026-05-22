import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClientNotifications } from "@/context/ClientNotificationsContext";
import { useColors } from "@/hooks/useColors";

export function ClientToastBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { latestToast, dismissToast } = useClientNotifications();

  if (!latestToast) return null;

  return (
    <Pressable
      style={[styles.wrap, { top: insets.top + 8 }]}
      onPress={() => {
        dismissToast();
        router.push("/notifications");
      }}
    >
      <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <Feather name="bell" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>{latestToast.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
            {latestToast.body}
          </Text>
        </View>
        <Pressable onPress={dismissToast} hitSlop={12}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 99 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 13 },
  body: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
});
