import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminShell } from "@/components/admin/AdminShell";
import { TaskCard } from "@/components/admin/TaskCard";
import { AdminTask, useAdminTasks } from "@/hooks/useAdminTasks";
import { useColors } from "@/hooks/useColors";
import { getStaffMembers, StaffMember } from "@/lib/staff";
import { AddButton, EditorModal, EmptyState, ErrorState, Input, Label, SaveButton } from "@/app/admin/notes";

const COLUMNS = [
  { key: "pendiente", label: "Pendiente", color: "#F59E0B" },
  { key: "en_proceso", label: "En proceso", color: "#3B82F6" },
  { key: "completada", label: "Completadas", color: "#22C55E" },
];
const PRIORITIES = ["baja", "media", "alta", "urgente"];

export default function AdminTasksScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ create?: string }>();
  const { tasks, loading, error, save, setStatus, remove } = useAdminTasks();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [editing, setEditing] = useState<AdminTask | null>(null);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("media");
  const [status, setFormStatus] = useState("pendiente");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStaffMembers().then(setStaff).catch(() => setStaff([]));
  }, []);

  const open = (task?: AdminTask) => {
    setEditing(task || null);
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setAssignedTo(task?.assigned_to || null);
    setDueDate(task?.due_date || "");
    setPriority(task?.priority || "media");
    setFormStatus(task?.status || "pendiente");
    setModal(true);
  };

  useEffect(() => {
    if (params.create === "1") open();
  }, [params.create]);

  const names = useMemo(() => Object.fromEntries(staff.map((member) => [member.id, member.label])), [staff]);
  const filtered = priorityFilter === "todas" ? tasks : tasks.filter((task) => task.priority === priorityFilter);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await save({ title: title.trim(), description: description.trim() || null, assigned_to: assignedTo, due_date: dueDate || null, priority, status }, editing?.id);
      setModal(false);
    } catch (e: any) {
      Alert.alert("No se pudo guardar", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Tareas" subtitle="Trabajo interno organizado por estado, prioridad y responsable." action={<AddButton onPress={() => open()} />}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {["todas", ...PRIORITIES].map((item) => <Pressable key={item} onPress={() => setPriorityFilter(item)} style={[styles.filter, { borderColor: priorityFilter === item ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: priorityFilter === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}
        </ScrollView>
        {error ? <ErrorState message="Falta activar admin_tasks. Ejecuta la migración del panel." /> : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
            {COLUMNS.map((column) => {
              const columnTasks = filtered.filter((task) => task.status === column.key);
              return <View key={column.key} style={[styles.column, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.columnHeader}><View style={[styles.dot, { backgroundColor: column.color }]} /><Text style={[styles.columnTitle, { color: colors.foreground }]}>{column.label}</Text><Text style={[styles.count, { color: colors.mutedForeground }]}>{columnTasks.length}</Text></View>
                {columnTasks.map((task) => <TaskCard key={task.id} task={task} assignee={task.assigned_to ? names[task.assigned_to] : undefined} onPress={() => open(task)} onComplete={() => setStatus(task.id, "completada")} onDelete={() => Alert.alert("Eliminar tarea", "¿Deseas eliminarla?", [{ text: "Cancelar" }, { text: "Eliminar", style: "destructive", onPress: () => remove(task.id) }])} />)}
                {!columnTasks.length ? <EmptyState icon="check-square" title="Sin tareas" text="Nada en esta columna." /> : null}
              </View>;
            })}
          </ScrollView>
        )}
      </ScrollView>
      <EditorModal visible={modal} onClose={() => setModal(false)} title={editing ? "Editar tarea" : "Nueva tarea"}>
        <Label text="Título *" /><Input value={title} onChangeText={setTitle} placeholder="Ej. Confirmar material para instalación" />
        <Label text="Descripción" /><Input value={description} onChangeText={setDescription} multiline placeholder="Contexto y resultado esperado..." />
        <Label text="Fecha límite (AAAA-MM-DD)" /><Input value={dueDate} onChangeText={setDueDate} placeholder="2026-06-20" />
        <Picker label="Prioridad" values={PRIORITIES} selected={priority} onSelect={setPriority} />
        <Picker label="Estado" values={COLUMNS.map((item) => item.key)} selected={status} onSelect={setFormStatus} />
        <Label text="Responsable" />
        <View style={styles.people}><Pressable onPress={() => setAssignedTo(null)} style={[styles.person, { borderColor: !assignedTo ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: !assignedTo ? colors.primary : colors.mutedForeground }]}>Sin asignar</Text></Pressable>{staff.map((member) => <Pressable key={member.id} onPress={() => setAssignedTo(member.id)} style={[styles.person, { borderColor: assignedTo === member.id ? colors.primary : colors.border }]}><Text numberOfLines={1} style={[styles.filterText, { color: assignedTo === member.id ? colors.primary : colors.mutedForeground }]}>{member.label}</Text></Pressable>)}</View>
        <SaveButton label="Guardar tarea" saving={saving} disabled={!title.trim()} onPress={submit} />
      </EditorModal>
    </AdminShell>
  );
}

function Picker({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  const colors = useColors();
  return <View style={{ marginBottom: 14 }}><Label text={label} /><View style={styles.people}>{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={[styles.person, { borderColor: selected === value ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: selected === value ? colors.primary : colors.mutedForeground }]}>{value.replace("_", " ")}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  filters: { gap: 8, marginBottom: 16 },
  filter: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },
  board: { gap: 14, paddingBottom: 10 },
  column: { width: 330, borderRadius: 17, borderWidth: 1, padding: 12 },
  columnHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 14 },
  count: { fontFamily: "Inter_700Bold", fontSize: 11 },
  people: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  person: { maxWidth: 190, borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
});

