import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminTask } from "@/hooks/useAdminTasks";
import { useColors } from "@/hooks/useColors";

const PRIORITY: Record<string, string> = { baja: "#22C55E", media: "#F59E0B", alta: "#F97316", urgente: "#EF4444" };

export function TaskCard({ task, assignee, onPress, onComplete, onDelete }: { task: AdminTask; assignee?: string; onPress: () => void; onComplete: () => void; onDelete?: () => void }) {
  const colors = useColors();
  const accent = PRIORITY[task.priority] || PRIORITY.media;
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accent }]}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{task.title}</Text>
        <View style={[styles.pill, { backgroundColor: accent + "20" }]}><Text style={[styles.pillText, { color: accent }]}>{task.priority}</Text></View>
      </View>
      {task.description ? <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>{task.description}</Text> : null}
      <View style={styles.meta}>
        <Feather name="user" size={13} color={colors.mutedForeground} />
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{assignee || "Sin responsable"}</Text>
        {task.due_date ? <Text style={[styles.metaText, { color: colors.mutedForeground }]}>· {task.due_date}</Text> : null}
      </View>
      <View style={styles.actions}>
        {task.status !== "completada" ? <Pressable onPress={onComplete}><Feather name="check-circle" size={18} color="#22C55E" /></Pressable> : null}
        {onDelete ? <Pressable onPress={onDelete}><Feather name="trash-2" size={17} color="#EF4444" /></Pressable> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14, marginBottom: 10 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 14 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  pillText: { fontFamily: "Inter_700Bold", fontSize: 9, textTransform: "uppercase" },
  description: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 },
  metaText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 14, marginTop: 12 },
});
