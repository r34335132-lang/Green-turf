import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { AppRole, fetchMyProfile } from "@/lib/profile";

const OPERATIONS = [
  { icon: "package" as const, title: "Inventario", subtitle: "Stock, entradas y salidas", route: "/inventory", adminOnly: false },
  { icon: "bar-chart-2" as const, title: "Reportes financieros", subtitle: "Ventas por periodo y cliente", route: "/reports", adminOnly: true },
  { icon: "check-square" as const, title: "Tareas", subtitle: "Pendientes y responsables", route: "/tasks", adminOnly: false },
  { icon: "file-text" as const, title: "Notas", subtitle: "Contexto interno del equipo", route: "/notes", adminOnly: false },
  { icon: "briefcase" as const, title: "Colaboradores", subtitle: "Crear cuentas y administrar roles", route: "/team", adminOnly: true },
  { icon: "plus-circle" as const, title: "Nuevo producto", subtitle: "Agregar pasto al catálogo", route: "/add-product", adminOnly: true },
  { icon: "truck" as const, title: "Proveedores y proyectos", subtitle: "Administrar proveedores", route: "/add-vendor", adminOnly: true },
  { icon: "gift" as const, title: "Enviar promoción", subtitle: "Notificar a clientes", route: "/send-promo", adminOnly: true },
  { icon: "tool" as const, title: "Mantenimiento", subtitle: "Solicitudes y trabajos realizados", route: "/admin-maintenance", adminOnly: false },
];

export default function OperationsMoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<AppRole>("cliente");
  useEffect(() => { fetchMyProfile().then((profile) => setRole(profile?.role || "cliente")); }, []);
  const operations = OPERATIONS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>GREEN TURF OPERACIONES</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Más herramientas</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{role === "admin" ? "Administración completa del negocio." : "Herramientas para atender tus clientes asignados."}</Text>
        <View style={styles.grid}>
          {operations.map((item) => <Pressable key={item.route} onPress={() => router.push(item.route as never)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}><Feather name={item.icon} size={23} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} /></Pressable>)}
        </View>
        <Text style={[styles.section, { color: colors.mutedForeground }]}>APP Y CUENTA</Text>
        <View style={styles.grid}>
          <Pressable onPress={() => router.push("/catalog" as never)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}><Feather name="grid" size={23} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Ver catálogo</Text><Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Consultar productos como cliente</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} /></Pressable>
          <Pressable onPress={() => router.push("/profile" as never)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}><Feather name="user" size={23} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Perfil y salir</Text><Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Cuenta y cierre de sesión</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} /></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, maxWidth: 1000, width: "100%", alignSelf: "center" },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.5 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginTop: 5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 5, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
  card: { minWidth: 290, flex: 1, minHeight: 82, borderRadius: 17, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  cardSubtitle: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3, lineHeight: 16 },
  section: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.4, marginTop: 28, marginBottom: 10 },
});
