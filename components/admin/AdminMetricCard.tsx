import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function AdminMetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number | string;
  accent: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: accent + "20" }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minWidth: 145, flex: 1, borderRadius: 16, borderWidth: 1, padding: 16 },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  value: { fontFamily: "Inter_700Bold", fontSize: 25 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 3 },
});

