import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminEvent } from "@/hooks/useAdminEvents";
import { useColors } from "@/hooks/useColors";

const STATUS: Record<string, string> = { pendiente: "#F59E0B", confirmado: "#3B82F6", terminado: "#22C55E", cancelado: "#EF4444" };

export function EventCard({ event, onEdit, onDelete }: { event: AdminEvent; onEdit: () => void; onDelete?: () => void }) {
  const colors = useColors();
  const accent = STATUS[event.status] || STATUS.pendiente;
  return (
    <Pressable onPress={onEdit} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.time, { backgroundColor: accent + "1F" }]}>
        <Text style={[styles.timeText, { color: accent }]}>{event.event_time?.slice(0, 5) || "Todo el día"}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{event.event_type}{event.client_name ? ` · ${event.client_name}` : ""}</Text>
      </View>
      {onDelete ? <Pressable onPress={onDelete} hitSlop={8}><Feather name="trash-2" size={16} color="#EF4444" /></Pressable> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  time: { width: 70, minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  timeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  copy: { flex: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 14 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
});
