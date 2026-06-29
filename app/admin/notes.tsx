import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AdminShell } from "@/components/admin/AdminShell";
import { NoteCard } from "@/components/admin/NoteCard";
import { AdminNote, useAdminNotes } from "@/hooks/useAdminNotes";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Cliente", "Instalación", "Inventario", "Compra", "Pendiente", "General"];

export default function AdminNotesScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ create?: string }>();
  const { notes, loading, error, save, remove } = useAdminNotes();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [editing, setEditing] = useState<AdminNote | null>(null);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const open = (note?: AdminNote) => {
    setEditing(note || null);
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setFormCategory(note?.category || "General");
    setPinned(note?.is_pinned || false);
    setModal(true);
  };

  useEffect(() => {
    if (params.create === "1") open();
  }, [params.create]);

  const filtered = useMemo(() => notes.filter((note) => {
    const matchesSearch = `${note.title} ${note.content || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "Todas" || note.category === category);
  }), [category, notes, search]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await save({ title: title.trim(), content: content.trim() || null, category: formCategory, is_pinned: pinned }, editing?.id);
      setModal(false);
    } catch (e: any) {
      Alert.alert("No se pudo guardar", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Notas" subtitle="Memoria interna para clientes, compras, instalaciones y pendientes." action={<AddButton onPress={() => open()} />}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.toolbar}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={17} color={colors.mutedForeground} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Buscar notas..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {["Todas", ...CATEGORIES].map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { borderColor: category === item ? colors.primary : colors.border, backgroundColor: category === item ? colors.primary + "18" : colors.card }]}><Text style={[styles.chipText, { color: category === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}
          </ScrollView>
        </View>
        {error ? <ErrorState message="Falta activar la tabla admin_notes. Ejecuta la migración del panel." /> : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : (
          <View style={styles.grid}>
            {filtered.map((note) => <NoteCard key={note.id} note={note} onEdit={() => open(note)} onPin={() => save({ title: note.title, content: note.content, category: note.category, is_pinned: !note.is_pinned }, note.id)} onDelete={() => Alert.alert("Eliminar nota", "Esta acción no se puede deshacer.", [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => remove(note.id) }])} />)}
          </View>
        )}
        {!loading && !filtered.length ? <EmptyState icon="file-text" title="Aún no hay notas" text="Crea la primera nota para que el equipo comparta contexto." /> : null}
      </ScrollView>
      <EditorModal visible={modal} onClose={() => setModal(false)} title={editing ? "Editar nota" : "Nueva nota"}>
        <Label text="Título *" /><Input value={title} onChangeText={setTitle} placeholder="Ej. Confirmar medidas con cliente" />
        <Label text="Contenido" /><Input value={content} onChangeText={setContent} placeholder="Escribe los detalles..." multiline />
        <Label text="Categoría" /><View style={styles.formChips}>{CATEGORIES.map((item) => <Pressable key={item} onPress={() => setFormCategory(item)} style={[styles.chip, { borderColor: formCategory === item ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: formCategory === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}</View>
        <Pressable onPress={() => setPinned(!pinned)} style={styles.pinRow}><Feather name="bookmark" size={18} color={pinned ? colors.primary : colors.mutedForeground} /><Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>Marcar como importante</Text></Pressable>
        <SaveButton label="Guardar nota" saving={saving} disabled={!title.trim()} onPress={submit} />
      </EditorModal>
    </AdminShell>
  );
}

export function AddButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={18} color="#071000" /><Text style={styles.addText}>Nuevo</Text></Pressable>;
}

export function EditorModal({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text numberOfLines={1} style={[styles.modalTitle, { color: colors.foreground }]}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={12}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.background }]}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Label({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.label, { color: colors.mutedForeground }]}>{text}</Text>;
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  const colors = useColors();
  return <TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, props.multiline && styles.area, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, props.style]} />;
}

export function SaveButton({ label, saving, disabled, onPress }: { label: string; saving: boolean; disabled?: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable disabled={saving || disabled} onPress={onPress} style={[styles.save, { backgroundColor: colors.primary, opacity: saving || disabled ? 0.5 : 1 }]}>{saving ? <ActivityIndicator color="#071000" /> : <Text style={styles.saveText}>{label}</Text>}</Pressable>;
}

export function EmptyState({ icon, title, text }: { icon: keyof typeof Feather.glyphMap; title: string; text: string }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.primary + "14" }]}><Feather name={icon} size={26} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text></View>;
}

export function ErrorState({ message }: { message: string }) {
  return <View style={styles.error}><Feather name="alert-triangle" size={17} color="#F59E0B" /><Text style={styles.errorText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1400, width: "100%", alignSelf: "center" },
  toolbar: { gap: 12, marginBottom: 18 },
  search: { maxWidth: 520, height: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 9 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, outlineStyle: "none" } as any,
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 11, paddingVertical: 7 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  add: { height: 42, paddingHorizontal: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  addText: { color: "#071000", fontFamily: "Inter_700Bold", fontSize: 12 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 16 },
  modal: { width: "100%", maxWidth: 540, height: "90%", maxHeight: 760, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  modalHeader: { minHeight: 58, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  modalTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 18, marginRight: 12 },
  closeButton: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  modalBody: { flex: 1, minHeight: 0 },
  modalBodyContent: { padding: 18, paddingBottom: 140 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 7 },
  input: { minHeight: 46, borderRadius: 11, borderWidth: 1, paddingHorizontal: 13, marginBottom: 14, fontFamily: "Inter_500Medium", fontSize: 13 },
  area: { minHeight: 110, paddingTop: 12, textAlignVertical: "top" },
  formChips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  pinRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 },
  save: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#071000", fontFamily: "Inter_700Bold", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 70 },
  emptyIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 14 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6, textAlign: "center", maxWidth: 330 },
  error: { borderRadius: 12, padding: 12, backgroundColor: "#F59E0B14", flexDirection: "row", gap: 8, marginBottom: 14 },
  errorText: { color: "#F59E0B", fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
});
