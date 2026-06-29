import { Stack, router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fetchMyProfile, isStaffRole } from "@/lib/profile";

export default function AdminLayout() {
  const colors = useColors();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => {
        if (!profile || !isStaffRole(profile.role)) {
          router.replace("/(tabs)" as never);
          return;
        }
        const adminOnly = ["/admin/sales", "/admin/reports", "/admin/team", "/admin/add-product", "/admin/add-vendor", "/admin/send-promo"];
        if (profile.role !== "admin" && adminOnly.some((route) => pathname.startsWith(route))) {
          router.replace("/operations" as never);
          return;
        }
        setChecking(false);
      })
      .catch(() => router.replace("/(tabs)" as never));
  }, [pathname]);

  if (checking) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
