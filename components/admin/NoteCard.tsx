import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminNote } from "@/hooks/useAdminNotes";
import { useColors } from "@/hooks/useColors";

export function NoteCard({ note, onEdit, onDelete, onPin }: { note: AdminNote; onEdit: () => void; onDelete: () => void; onPin: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onEdit} style={[styles.card, { backgroundColor: colors.card, borderColor: note.is_pinned ? colors.primary : colors.border }]}>
      <View style={styles.top}>
        <View style={[styles.category, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{note.category}</Text>
        </View>
        <Pressable onPress={onPin} hitSlop={8}>
          <Feather name="bookmark" size={18} color={note.is_pinned ? colors.primary : colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{note.title}</Text>
      <Text style={[styles.content, { color: colors.mutedForeground }]} numberOfLines={3}>{note.content || "Sin contenido adicional"}</Text>
      <View style={styles.footer}>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(note.updated_at).toLocaleDateString("es-MX")}</Text>
        <Pressable onPress={onDelete} hitSlop={8}><Feather name="trash-2" size={16} color="#EF4444" /></Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minWidth: 250, flex: 1, borderRadius: 16, borderWidth: 1, padding: 16 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  category: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  categoryText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 14 },
  content: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 7, minHeight: 40 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  date: { fontFamily: "Inter_500Medium", fontSize: 11 },
});

