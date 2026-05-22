import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStaffNotifications } from "@/context/StaffNotificationsContext";
import { useColors } from "@/hooks/useColors";

export function StaffToastBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { latestToast, dismissToast } = useStaffNotifications();

  if (!latestToast) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]}>
      <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "25" }]}>
          <Feather name="bell" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>{latestToast.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
            {latestToast.body}
          </Text>
        </View>
        <Pressable onPress={dismissToast} hitSlop={12}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 14 },
  body: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2, lineHeight: 16 },
});
