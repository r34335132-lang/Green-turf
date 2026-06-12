import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminQuickAction } from "@/components/admin/AdminQuickAction";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventCard } from "@/components/admin/EventCard";
import { TaskCard } from "@/components/admin/TaskCard";
import { getAdminProducts } from "@/data/products";
import { useAdminEvents } from "@/hooks/useAdminEvents";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { useColors } from "@/hooks/useColors";
import { getAdminLeads, LeadRow } from "@/lib/leads";
import { getStaffMembers, StaffMember } from "@/lib/staff";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const { tasks, loading: tasksLoading, error: tasksError, refresh: refreshTasks, setStatus } = useAdminTasks();
  const { events, loading: eventsLoading, error: eventsError, refresh: refreshEvents } = useAdminEvents();
  const [products, setProducts] = useState<Record<string, any>[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingCore, setLoadingCore] = useState(true);

  const loadCore = useCallback(async () => {
    setLoadingCore(true);
    const [productResult, leadResult, staffResult] = await Promise.allSettled([
      getAdminProducts(),
      getAdminLeads(),
      getStaffMembers(),
    ]);
    setProducts(productResult.status === "fulfilled" ? productResult.value : []);
    setLeads(leadResult.status === "fulfilled" ? leadResult.value : []);
    setStaff(staffResult.status === "fulfilled" ? staffResult.value : []);
    setLoadingCore(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadCore();
    refreshTasks();
    refreshEvents();
  }, [loadCore, refreshEvents, refreshTasks]));

  const names = useMemo(() => Object.fromEntries(staff.map((member) => [member.id, member.label])), [staff]);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((event) => event.event_date >= today && event.status !== "cancelado").slice(0, 3);
  const openTasks = tasks.filter((task) => task.status !== "completada");
  const lowStock = products.filter((product) => Number(product.stock || 0) <= Number(product.min_stock ?? 5));
  const pendingLeads = leads.filter((lead) => ["pendiente", "nuevo"].includes(lead.status));
  const setupNeeded = tasksError || eventsError;

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Todo lo importante del negocio, en un solo lugar."
      action={
        <Pressable onPress={loadCore} style={[styles.refresh, { borderColor: colors.border }]}>
          <Feather name="refresh-cw" size={17} color={colors.primary} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {setupNeeded ? (
          <View style={[styles.setup, { backgroundColor: "#F59E0B14", borderColor: "#F59E0B50" }]}>
            <Feather name="database" size={18} color="#F59E0B" />
            <Text style={styles.setupText}>Ejecuta `supabase/admin-operations.sql` para activar notas, calendario, tareas y movimientos.</Text>
          </View>
        ) : null}

        {loadingCore || tasksLoading || eventsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
        ) : null}

        <View style={styles.metrics}>
          <AdminMetricCard icon="package" label="Productos en stock" value={products.filter((p) => Number(p.stock || 0) > 0).length} accent={colors.primary} />
          <AdminMetricCard icon="alert-triangle" label="Bajo stock" value={lowStock.length} accent="#F59E0B" />
          <AdminMetricCard icon="inbox" label="Solicitudes pendientes" value={pendingLeads.length} accent="#3B82F6" />
          <AdminMetricCard icon="check-square" label="Tareas pendientes" value={openTasks.length} accent="#EF4444" />
          <AdminMetricCard icon="calendar" label="Próximos eventos" value={upcomingEvents.length} accent="#A855F7" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accesos rápidos</Text>
        <View style={styles.actions}>
          <AdminQuickAction icon="file-plus" label="Crear nota" onPress={() => router.push("/admin/notes?create=1" as never)} />
          <AdminQuickAction icon="check-square" label="Crear tarea" onPress={() => router.push("/admin/tasks?create=1" as never)} />
          <AdminQuickAction icon="calendar" label="Agregar evento" onPress={() => router.push("/admin/calendar?create=1" as never)} />
          <AdminQuickAction icon="package" label="Ver stock" onPress={() => router.push("/admin/inventory" as never)} />
          <AdminQuickAction icon="plus-circle" label="Crear producto" onPress={() => router.push("/admin/add-product" as never)} />
        </View>

        <View style={styles.columns}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Tareas prioritarias</Text>
              <Pressable onPress={() => router.push("/admin/tasks" as never)}><Text style={[styles.link, { color: colors.primary }]}>Ver todas</Text></Pressable>
            </View>
            {openTasks.slice(0, 4).map((task) => (
              <TaskCard key={task.id} task={task} assignee={task.assigned_to ? names[task.assigned_to] : undefined} onPress={() => router.push("/admin/tasks" as never)} onComplete={() => setStatus(task.id, "completada")} />
            ))}
            {!openTasks.length ? <Empty text="No hay tareas pendientes." /> : null}
          </View>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Próximos eventos</Text>
              <Pressable onPress={() => router.push("/admin/calendar" as never)}><Text style={[styles.link, { color: colors.primary }]}>Abrir calendario</Text></Pressable>
            </View>
            {upcomingEvents.map((event) => <EventCard key={event.id} event={event} onEdit={() => router.push("/admin/calendar" as never)} />)}
            {!upcomingEvents.length ? <Empty text="La agenda está libre por ahora." /> : null}
          </View>
        </View>
      </ScrollView>
    </AdminShell>
  );
}

function Empty({ text }: { text: string }) {
  const colors = useColors();
  return <View style={styles.empty}><Feather name="check-circle" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1400, width: "100%", alignSelf: "center" },
  refresh: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  setup: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  setupText: { color: "#F59E0B", fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 26, marginBottom: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 24, alignItems: "flex-start" },
  panel: { minWidth: 300, flex: 1, borderRadius: 18, borderWidth: 1, padding: 16 },
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  panelTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  link: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
