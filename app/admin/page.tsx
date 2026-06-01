import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminLeadCard } from "@/components/admin/AdminLeadCard";
import { AdminProductCard } from "@/components/admin/AdminProductCard";
import { AdminQuickActionsModal } from "@/components/admin/AdminQuickActionsModal";
import { AssignVendorModal } from "@/components/admin/AssignVendorModal";
import { getAdminProducts } from "@/data/products";
import { useStaffNotifications } from "@/context/StaffNotificationsContext";
import { useColors } from "@/hooks/useColors";
import { getAdminLeads, LeadRow } from "@/lib/leads";
import { getMaintenanceRequests, MaintenanceRequest } from "@/lib/maintenance";
import {
  assignLeadToVendor,
  getCurrentStaffProfile,
  getStaffMembers,
  StaffMember,
} from "@/lib/staff";
import { supabase } from "@/lib/supabase";

type TabType = "catalog" | "tracking";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unreadCount, refreshUnread, markAllRead } = useStaffNotifications();

  const [activeTab, setActiveTab] = useState<TabType>("tracking");
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [vendors, setVendors] = useState<StaffMember[]>([]);
  const [staffRole, setStaffRole] = useState<string>("cliente");
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignLead, setAssignLead] = useState<LeadRow | null>(null);
  const [quickMenuVisible, setQuickMenuVisible] = useState(false);
  const [maintRequests, setMaintRequests] = useState<MaintenanceRequest[]>([]);

  const vendorMap = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v.label])),
    [vendors]
  );

  const stats = useMemo(() => {
    const pending = leads.filter((l) => l.status === "pendiente").length;
    const unassigned = leads.filter((l) => !l.assigned_to).length;
    const activeProducts = products.filter((p) => !p.is_paused).length;
    const maintPending = maintRequests.filter((m) => m.status === "pendiente").length;
    return { pending, unassigned, activeProducts, totalLeads: leads.length, maintPending };
  }, [leads, products, maintRequests]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const profile = await getCurrentStaffProfile();
      if (profile) setStaffRole(profile.role);

      const [prodData, vendorList] = await Promise.all([
        getAdminProducts(),
        getStaffMembers().catch(() => []),
      ]);
      setProducts(prodData);
      setVendors(vendorList);

      let leadData: LeadRow[] = [];
      try {
        leadData = await getAdminLeads();
        setLeadsError(null);
      } catch (leadErr: any) {
        setLeadsError(leadErr.message || "No se pudieron cargar cotizaciones");
        leadData = [];
      }
      setLeads(leadData);
      try {
        setMaintRequests(await getMaintenanceRequests());
      } catch {
        setMaintRequests([]);
      }
      await refreshUnread();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      if (activeTab === "tracking") {
        markAllRead();
      }
    }, [activeTab])
  );

  const isAdmin = staffRole === "admin";

  const togglePauseProduct = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_paused: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_paused: !currentStatus } : p))
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const deleteProduct = (id: string, name: string) => {
    Alert.alert("Eliminar producto", `¿Eliminar "${name}" permanentemente?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("products").delete().eq("id", id);
          if (error) Alert.alert("Error", error.message);
          else setProducts((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const advanceLeadStatus = async (leadId: string, currentStatus: string) => {
    const order: Record<string, string> = {
      pendiente: "contactado",
      contactado: "cotizado",
      cotizado: "cerrado",
      cerrado: "descartado",
      descartado: "pendiente",
    };
    const nextStatus = order[currentStatus] || "pendiente";
    try {
      const { error } = await supabase
        .from("leads_tracking")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", leadId);
      if (error) throw error;
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAssign = async (vendorId: string | null) => {
    if (!assignLead) return;
    setAssigning(true);
    try {
      await assignLeadToVendor(assignLead.id, vendorId);
      const vendor = vendors.find((v) => v.id === vendorId);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === assignLead.id
            ? {
                ...l,
                assigned_to: vendorId,
                assigned_profile: vendor
                  ? {
                      id: vendor.id,
                      first_name: vendor.first_name,
                      last_name: vendor.last_name,
                      role: vendor.role,
                    }
                  : null,
              }
            : l
        )
      );
      setAssignLead(null);
      Alert.alert("Listo", vendorId ? "Cotización asignada al vendedor." : "Cotización sin asignar.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setAssigning(false);
    }
  };

  const StatCard = ({
    icon,
    label,
    value,
    accent,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: number | string;
    accent: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: accent + "22" }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <AdminQuickActionsModal
        visible={quickMenuVisible}
        isAdmin={isAdmin}
        onClose={() => setQuickMenuVisible(false)}
      />
      <AssignVendorModal
        visible={!!assignLead}
        lead={assignLead}
        vendors={vendors}
        loading={assigning}
        onClose={() => setAssignLead(null)}
        onAssign={handleAssign}
      />

      <LinearGradient
        colors={["#1a3d0a", "#0f1f08", colors.background]}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.heroRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroEyebrow, { color: colors.primary }]}>GREEN TURF · CRM</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Centro de control</Text>
          </View>
          <Pressable
            onPress={() => setQuickMenuVisible(true)}
            style={[styles.heroAdd, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={20} color="#000" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="inbox" label="Cotizaciones" value={stats.totalLeads} accent={colors.primary} />
          <StatCard icon="alert-circle" label="Pendientes" value={stats.pending} accent="#EF4444" />
          <StatCard icon="user" label="Sin asignar" value={stats.unassigned} accent="#F59E0B" />
        </View>
      </LinearGradient>

      {/* Contenedor ScrollView para las pestañas, permite deslizar si la pantalla es estrecha */}
      <View style={{ height: 60 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}
          style={styles.tabScroll}
        >
          <Pressable
            onPress={() => {
              setActiveTab("tracking");
              markAllRead();
            }}
            style={[styles.tab, activeTab === "tracking" && styles.tabActive]}
          >
            <Feather
              name="bell"
              size={16}
              color={activeTab === "tracking" ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "tracking" ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Cotiz.
            </Text>
            {(unreadCount > 0 || stats.pending > 0) && activeTab !== "tracking" ? (
              <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                <Text style={styles.badgeText}>{unreadCount || stats.pending}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("catalog")}
            style={[styles.tab, activeTab === "catalog" && styles.tabActive]}
          >
            <Feather
              name="package"
              size={16}
              color={activeTab === "catalog" ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "catalog" ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Invent.
            </Text>
          </Pressable>

          {/* Nuevas pestañas de acceso rápido a herramientas */}
          <Pressable
            onPress={() => router.push("/admin/agenda")}
            style={styles.tab}
          >
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
            <Text style={[styles.tabText, { color: colors.mutedForeground }]}>Agenda</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/add-vendor")}
            style={styles.tab}
          >
            <Feather name="users" size={16} color={colors.mutedForeground} />
            <Text style={[styles.tabText, { color: colors.mutedForeground }]}>Dist.</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/maintenance")}
            style={styles.tab}
          >
            <Feather name="tool" size={16} color={colors.mutedForeground} />
            <Text style={[styles.tabText, { color: colors.mutedForeground }]}>Mant.</Text>
            {stats.maintPending > 0 ? (
              <View style={[styles.badge, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.badgeText}>{stats.maintPending}</Text>
              </View>
            ) : null}
          </Pressable>
        </ScrollView>
      </View>

      {leadsError && activeTab === "tracking" ? (
        <View style={styles.errorBox}>
          <Feather name="alert-triangle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>
            {leadsError}. Ejecuta supabase/admin-crm-upgrade.sql
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === "catalog" ? products : leads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          onRefresh={loadDashboardData}
          refreshing={loading}
          ListHeaderComponent={
            activeTab === "tracking" ? (
              <Text style={[styles.listHint, { color: colors.mutedForeground }]}>
                Toca el estado para avanzar · {isAdmin ? "Asigna vendedores con el botón verde" : "Tus cotizaciones asignadas"}
              </Text>
            ) : null
          }
          renderItem={({ item }) =>
            activeTab === "catalog" ? (
              <AdminProductCard
                item={item}
                onTogglePause={() => togglePauseProduct(item.id, item.is_paused)}
                onDelete={() => deleteProduct(item.id, item.name)}
                onUpdateStock={async (id, newStock) => {
                  const { error } = await supabase
                    .from("products")
                    .update({ stock: newStock })
                    .eq("id", id);
                  if (error) Alert.alert("Error", "No se pudo actualizar el stock");
                  else loadDashboardData();
                }}
              />
            ) : (
              <AdminLeadCard
                item={item as LeadRow}
                vendorMap={vendorMap}
                isAdmin={isAdmin}
                onAdvanceStatus={() => advanceLeadStatus(item.id, item.status)}
                onAssign={() => setAssignLead(item as LeadRow)}
              />
            )
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="inbox" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeTab === "tracking" ? "Sin cotizaciones aún" : "Sin productos"}
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {activeTab === "tracking"
                  ? "Cuando un cliente solicite cotización, aparecerá aquí con alerta."
                  : "Agrega pasto con el botón +"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  heroEyebrow: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.2 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5, marginTop: 2 },
  heroAdd: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "flex-start",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 },
  tabScroll: {
    marginHorizontal: 16,
    marginTop: -8,
  },
  tabBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    minWidth: '100%', 
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "rgba(109,190,0,0.12)" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginLeft: -2,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#EF444415",
  },
  errorText: { flex: 1, color: "#EF4444", fontFamily: "Inter_500Medium", fontSize: 12 },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  listHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 12 },
  center: { alignItems: "center", justifyContent: "center", padding: 48 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 14 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, textAlign: "center" },
});