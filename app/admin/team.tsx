import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EditorModal, EmptyState, Input, Label, SaveButton } from "@/app/admin/notes";
import { AdminShell } from "@/components/admin/AdminShell";
import { PhoneInput } from "@/components/PhoneInput";
import { useColors } from "@/hooks/useColors";
import { displayMexicanPhone } from "@/lib/phone";
import {
  PromotableClient,
  createStaffAccount,
  getCurrentStaffProfile,
  getPromotableClients,
  promoteUserToVendor,
} from "@/lib/staff";
import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
};

const ROLES = ["admin", "staff", "vendedor", "instalador"];
const COLLABORATOR_ROLES = ["vendedor", "staff", "instalador"] as const;
const ROLE_COLOR: Record<string, string> = { admin: "#A855F7", staff: "#3B82F6", vendedor: "#F59E0B", instalador: "#22C55E" };

export default function AdminTeamScreen() {
  const colors = useColors();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [promotable, setPromotable] = useState<PromotableClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIsAdmin, setCurrentIsAdmin] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [mode, setMode] = useState<"create" | "existing">("create");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"vendedor" | "staff" | "instalador">("vendedor");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [profile, result, clientsResult] = await Promise.all([
      getCurrentStaffProfile(),
      supabase.from("profiles").select("id, first_name, last_name, email, phone, role").in("role", ROLES).order("first_name"),
      getPromotableClients().catch(() => []),
    ]);
    setCurrentIsAdmin(profile?.role === "admin");
    setMembers((result.data as TeamMember[]) || []);
    setPromotable(clientsResult);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeRole = async (member: TeamMember, nextRole: string) => {
    if (!currentIsAdmin || nextRole === member.role) return;
    setSavingId(member.id);
    const { error } = await supabase.rpc("admin_set_profile_role", { target_id: member.id, new_role: nextRole });
    setSavingId(null);
    if (error) return Alert.alert("No se pudo cambiar el rol", error.message);
    await load();
  };

  const reset = () => {
    setSelectedUserId(""); setFirstName(""); setLastName(""); setEmail("");
    setPhone(""); setPassword(""); setRole("vendedor"); setMode("create");
  };

  const saveCollaborator = async () => {
    setCreating(true);
    try {
      if (mode === "existing") {
        if (!selectedUserId) throw new Error("Selecciona una cuenta existente.");
        await promoteUserToVendor(selectedUserId, { role, phone });
      } else {
        if (!firstName.trim() || !email.trim() || password.length < 8) {
          throw new Error("Nombre, correo y contraseña de al menos 8 caracteres son obligatorios.");
        }
        await createStaffAccount({ email, password, firstName, lastName, phone, role });
      }
      setModal(false);
      reset();
      await load();
      Alert.alert("Colaborador listo", "La cuenta ya puede iniciar sesión con sus permisos asignados.");
    } catch (e: any) {
      Alert.alert("No se pudo agregar", e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminShell
      title="Colaboradores"
      subtitle="Cuentas, roles y responsables del seguimiento comercial."
      action={currentIsAdmin ? <Pressable onPress={() => setModal(true)} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="user-plus" size={17} color="#071000" /><Text style={styles.addText}>Agregar colaborador</Text></Pressable> : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.info, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "45" }]}><Feather name="shield" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.mutedForeground }]}>Los vendedores ven sus clientes asignados. Los importes, reportes y edición de precios son exclusivos del administrador.</Text></View>
        {loading ? <ActivityIndicator color={colors.primary} /> : <View style={styles.grid}>{members.map((member) => {
          const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email || "Sin nombre";
          const accent = ROLE_COLOR[member.role] || colors.primary;
          return <View key={member.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: accent + "25" }]}><Text style={[styles.initials, { color: accent }]}>{name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</Text></View>
            <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
            <Text style={[styles.contact, { color: colors.mutedForeground }]}>{member.email || "Sin correo"}</Text>
            {member.phone ? <Text style={[styles.phone, { color: colors.foreground }]}>{displayMexicanPhone(member.phone)}</Text> : null}
            {savingId === member.id ? <ActivityIndicator color={colors.primary} style={{ marginTop: 14 }} /> : <View style={styles.roles}>{ROLES.map((itemRole) => <Pressable key={itemRole} disabled={!currentIsAdmin} onPress={() => changeRole(member, itemRole)} style={[styles.role, { borderColor: member.role === itemRole ? accent : colors.border, opacity: currentIsAdmin || member.role === itemRole ? 1 : 0.55 }]}><Text style={[styles.roleText, { color: member.role === itemRole ? accent : colors.mutedForeground }]}>{itemRole}</Text></Pressable>)}</View>}
          </View>;
        })}</View>}
        {!loading && !members.length ? <EmptyState icon="briefcase" title="Sin colaboradores" text="Usa Agregar colaborador para crear o promover una cuenta." /> : null}
      </ScrollView>

      <EditorModal visible={modal} onClose={() => setModal(false)} title="Agregar colaborador">
        <View style={styles.modeRow}>
          <Chip selected={mode === "create"} label="Nueva cuenta" onPress={() => setMode("create")} />
          <Chip selected={mode === "existing"} label="Cuenta existente" onPress={() => setMode("existing")} />
        </View>
        <Label text="Rol" />
        <View style={styles.roles}>{COLLABORATOR_ROLES.map((itemRole) => <Chip key={itemRole} selected={role === itemRole} label={itemRole} onPress={() => setRole(itemRole)} />)}</View>
        {mode === "existing" ? (
          <>
            <Label text="Cuenta cliente" />
            <View style={styles.accountList}>{promotable.map((client) => <Chip key={client.id} selected={selectedUserId === client.id} label={client.label} onPress={() => { setSelectedUserId(client.id); setPhone(client.phone || ""); }} />)}</View>
            {!promotable.length ? <Text style={[styles.help, { color: colors.mutedForeground }]}>No hay cuentas cliente disponibles para convertir.</Text> : null}
          </>
        ) : (
          <>
            <Label text="Nombre *" /><Input value={firstName} onChangeText={setFirstName} returnKeyType="next" />
            <Label text="Apellido" /><Input value={lastName} onChangeText={setLastName} returnKeyType="next" />
            <Label text="Correo *" /><Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
            <Label text="Teléfono" /><PhoneInput compact value={phone} onChangeText={setPhone} />
            <Label text="Contraseña temporal *" /><Input value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 8 caracteres" />
          </>
        )}
        {mode === "existing" ? <><Label text="Teléfono" /><PhoneInput compact value={phone} onChangeText={setPhone} /></> : null}
        <SaveButton label={mode === "create" ? "Crear cuenta" : "Convertir en colaborador"} saving={creating} onPress={saveCollaborator} />
      </EditorModal>
    </AdminShell>
  );
}

function Chip({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.role, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + "18" : "transparent" }]}><Text numberOfLines={1} style={[styles.roleText, { color: selected ? colors.primary : colors.mutedForeground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1200, width: "100%", alignSelf: "center" },
  add: { height: 42, paddingHorizontal: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  addText: { color: "#071000", fontFamily: "Inter_700Bold", fontSize: 12 },
  info: { borderRadius: 13, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  infoText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 11, lineHeight: 17 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { minWidth: 260, flex: 1, maxWidth: 380, borderRadius: 17, borderWidth: 1, padding: 16 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Inter_700Bold", fontSize: 16 },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 12 },
  contact: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  phone: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 6 },
  roles: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, marginBottom: 12 },
  role: { maxWidth: 210, borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
  roleText: { fontFamily: "Inter_700Bold", fontSize: 9, textTransform: "capitalize" },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 },
  accountList: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14, maxHeight: 180 },
  help: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 14 },
});
