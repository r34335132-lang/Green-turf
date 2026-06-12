import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminShell } from "@/components/admin/AdminShell";
import { useColors } from "@/hooks/useColors";
import { getCurrentStaffProfile } from "@/lib/staff";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/app/admin/notes";

type TeamMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
};

const ROLES = ["admin", "staff", "vendedor", "instalador"];
const ROLE_COLOR: Record<string, string> = { admin: "#A855F7", staff: "#3B82F6", vendedor: "#F59E0B", instalador: "#22C55E" };

export default function AdminTeamScreen() {
  const colors = useColors();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIsAdmin, setCurrentIsAdmin] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [profile, result] = await Promise.all([
      getCurrentStaffProfile(),
      supabase.from("profiles").select("id, first_name, last_name, email, phone, role").in("role", ROLES).order("first_name"),
    ]);
    setCurrentIsAdmin(profile?.role === "admin");
    setMembers((result.data as TeamMember[]) || []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeRole = async (member: TeamMember, role: string) => {
    if (!currentIsAdmin || role === member.role) return;
    setSavingId(member.id);
    const { error } = await supabase.from("profiles").update({ role }).eq("id", member.id);
    setSavingId(null);
    if (error) return Alert.alert("No se pudo cambiar el rol", error.message);
    setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role } : item));
  };

  return (
    <AdminShell title="Equipo" subtitle="Responsables disponibles para tareas, eventos y seguimiento comercial.">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.info, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "45" }]}><Feather name="shield" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.mutedForeground }]}>Los roles `staff` e `instalador` quedan preparados por la migración. Solo un administrador puede cambiar responsabilidades.</Text></View>
        {loading ? <ActivityIndicator color={colors.primary} /> : <View style={styles.grid}>{members.map((member) => {
          const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email || "Sin nombre";
          const accent = ROLE_COLOR[member.role] || colors.primary;
          return <View key={member.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: accent + "25" }]}><Text style={[styles.initials, { color: accent }]}>{name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</Text></View>
            <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
            <Text style={[styles.contact, { color: colors.mutedForeground }]}>{member.email || member.phone || "Sin contacto"}</Text>
            {savingId === member.id ? <ActivityIndicator color={colors.primary} style={{ marginTop: 14 }} /> : <View style={styles.roles}>{ROLES.map((role) => <Pressable key={role} disabled={!currentIsAdmin} onPress={() => changeRole(member, role)} style={[styles.role, { borderColor: member.role === role ? accent : colors.border, opacity: currentIsAdmin || member.role === role ? 1 : 0.55 }]}><Text style={[styles.roleText, { color: member.role === role ? accent : colors.mutedForeground }]}>{role}</Text></Pressable>)}</View>}
          </View>;
        })}</View>}
        {!loading && !members.length ? <EmptyState icon="briefcase" title="Sin miembros" text="Promueve usuarios existentes para formar el equipo operativo." /> : null}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1200, width: "100%", alignSelf: "center" },
  info: { borderRadius: 13, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  infoText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 11, lineHeight: 17 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { minWidth: 260, flex: 1, maxWidth: 380, borderRadius: 17, borderWidth: 1, padding: 16 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Inter_700Bold", fontSize: 16 },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 12 },
  contact: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  roles: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  role: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 6 },
  roleText: { fontFamily: "Inter_700Bold", fontSize: 9, textTransform: "capitalize" },
});

