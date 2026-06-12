import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AdminLeadCard } from "@/components/admin/AdminLeadCard";
import { AdminShell } from "@/components/admin/AdminShell";
import { AssignVendorModal } from "@/components/admin/AssignVendorModal";
import { useColors } from "@/hooks/useColors";
import { getAdminLeads, LeadRow } from "@/lib/leads";
import { assignLeadToVendor, getCurrentStaffProfile, getStaffMembers, StaffMember } from "@/lib/staff";
import { supabase } from "@/lib/supabase";
import { EditorModal, EmptyState, Input, Label, SaveButton } from "@/app/admin/notes";

const STATUS_ORDER: Record<string, string> = {
  nuevo: "contactado",
  pendiente: "contactado",
  contactado: "cotizado",
  cotizado: "ganado",
  ganado: "perdido",
  cerrado: "perdido",
  perdido: "nuevo",
  descartado: "nuevo",
};

export default function AdminClientsScreen() {
  const colors = useColors();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [assignLead, setAssignLead] = useState<LeadRow | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [editingNotes, setEditingNotes] = useState<LeadRow | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [leadResult, staffResult, profileResult] = await Promise.allSettled([getAdminLeads(), getStaffMembers(), getCurrentStaffProfile()]);
    setLeads(leadResult.status === "fulfilled" ? leadResult.value : []);
    setStaff(staffResult.status === "fulfilled" ? staffResult.value : []);
    setIsAdmin(profileResult.status === "fulfilled" && profileResult.value?.role === "admin");
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const vendorMap = useMemo(() => Object.fromEntries(staff.map((member) => [member.id, member.label])), [staff]);
  const filtered = leads.filter((lead) => {
    const matchesSearch = `${lead.client_name} ${lead.phone} ${lead.email || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "todos" || lead.status === status);
  });

  const advance = async (lead: LeadRow) => {
    const next = STATUS_ORDER[lead.status] || "nuevo";
    const { error } = await supabase.from("leads_tracking").update({ status: next, updated_at: new Date().toISOString() }).eq("id", lead.id);
    if (error) return Alert.alert("No se pudo actualizar", error.message);
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: next } : item));
  };

  const assign = async (vendorId: string | null) => {
    if (!assignLead) return;
    setAssigning(true);
    try {
      await assignLeadToVendor(assignLead.id, vendorId);
      setAssignLead(null);
      await load();
    } catch (e: any) {
      Alert.alert("No se pudo asignar", e.message);
    } finally {
      setAssigning(false);
    }
  };

  const saveNotes = async () => {
    if (!editingNotes) return;
    setSavingNotes(true);
    const { error } = await supabase.from("leads_tracking").update({ notes: notes.trim() || null }).eq("id", editingNotes.id);
    setSavingNotes(false);
    if (error) return Alert.alert("No se pudo guardar", error.message);
    setLeads((current) => current.map((lead) => lead.id === editingNotes.id ? { ...lead, notes: notes.trim() || null } : lead));
    setEditingNotes(null);
  };

  return (
    <AdminShell title="Clientes y solicitudes" subtitle="Seguimiento comercial desde el primer mensaje hasta el cierre.">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.toolbar}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={17} color={colors.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar cliente, teléfono o correo..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{["todos", "pendiente", "nuevo", "contactado", "cotizado", "ganado", "perdido"].map((item) => <Pressable key={item} onPress={() => setStatus(item)} style={[styles.filter, { borderColor: status === item ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: status === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}</ScrollView>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} /> : filtered.map((lead) => <View key={lead.id}><AdminLeadCard item={lead} vendorMap={vendorMap} isAdmin={isAdmin} onAdvanceStatus={() => advance(lead)} onAssign={() => setAssignLead(lead)} /><Pressable onPress={() => { setEditingNotes(lead); setNotes(lead.notes || ""); }} style={[styles.notesButton, { borderColor: colors.border }]}><Feather name="message-square" size={14} color={colors.primary} /><Text style={[styles.notesText, { color: colors.primary }]}>{lead.notes ? "Editar notas del cliente" : "Agregar nota al cliente"}</Text></Pressable></View>)}
        {!loading && !filtered.length ? <EmptyState icon="users" title="Sin solicitudes" text="Las nuevas cotizaciones e instalaciones aparecerán aquí." /> : null}
      </ScrollView>
      <AssignVendorModal visible={!!assignLead} lead={assignLead} vendors={staff} loading={assigning} onClose={() => setAssignLead(null)} onAssign={assign} />
      <EditorModal visible={!!editingNotes} onClose={() => setEditingNotes(null)} title={`Notas · ${editingNotes?.client_name || ""}`}>
        <Label text="Contexto comercial" /><Input value={notes} onChangeText={setNotes} multiline placeholder="Acuerdos, objeciones, siguiente paso..." />
        <SaveButton label="Guardar notas" saving={savingNotes} onPress={saveNotes} />
      </EditorModal>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 920, width: "100%", alignSelf: "center" },
  toolbar: { gap: 10, marginBottom: 16 },
  search: { height: 46, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
  filters: { gap: 7 },
  filter: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },
  notesButton: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginTop: -8, marginBottom: 14 },
  notesText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
});

