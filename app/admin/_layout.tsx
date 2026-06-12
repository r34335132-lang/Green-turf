import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { fetchMyProfile, isStaffRole } from "@/lib/profile";

export default function AdminLayout() {
  const colors = useColors();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => {
        if (!profile || !isStaffRole(profile.role)) {
          router.replace("/(tabs)" as never);
          return;
        }
        setChecking(false);
      })
      .catch(() => router.replace("/(tabs)" as never));
  }, []);

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
