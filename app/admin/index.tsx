import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminQuickAction } from "@/components/admin/AdminQuickAction";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventCard } from "@/components/admin/EventCard";
import { getAdminProducts } from "@/data/products";
import { useAdminEvents } from "@/hooks/useAdminEvents";
import { useColors } from "@/hooks/useColors";
import { fetchMyProfile } from "@/lib/profile";
import { Customer, Sale, formatMoney, getCustomers, getSales, summarizeSales } from "@/lib/sales";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const { events, loading: eventsLoading, error: eventsError, refresh: refreshEvents } = useAdminEvents();
  const [products, setProducts] = useState<Record<string, any>[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCore, setLoadingCore] = useState(true);
  const [salesSetupNeeded, setSalesSetupNeeded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadCore = useCallback(async () => {
    setLoadingCore(true);
    const profile = await fetchMyProfile();
    const admin = profile?.role === "admin";
    setIsAdmin(admin);
    const [productResult, salesResult, customerResult] = await Promise.allSettled([
      getAdminProducts(), admin ? getSales() : Promise.resolve([]), getCustomers(),
    ]);
    setProducts(productResult.status === "fulfilled" ? productResult.value : []);
    setSales(salesResult.status === "fulfilled" ? salesResult.value : []);
    setCustomers(customerResult.status === "fulfilled" ? customerResult.value : []);
    setSalesSetupNeeded(admin && salesResult.status === "rejected");
    setLoadingCore(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadCore();
    refreshEvents();
  }, [loadCore, refreshEvents]));

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((event) => event.event_date >= today && event.status !== "cancelado").slice(0, 4);
  const lowStock = products.filter((product) => Number(product.stock || 0) <= Number(product.min_stock ?? 5));
  const salesSummary = summarizeSales(sales);
  const recentCustomers = [...customers].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);

  return (
    <AdminShell
      title="Centro de trabajo"
      subtitle="Ventas, clientes, agenda e inventario listos para el trabajo diario."
      action={<Pressable onPress={loadCore} style={[styles.refresh, { borderColor: colors.border }]}><Feather name="refresh-cw" size={17} color={colors.primary} /></Pressable>}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {eventsError || salesSetupNeeded ? (
          <View style={[styles.setup, { backgroundColor: "#F59E0B14", borderColor: "#F59E0B50" }]}>
            <Feather name="database" size={18} color="#F59E0B" />
            <Text style={styles.setupText}>Activa las migraciones `admin-operations.sql` y `admin-sales.sql` en Supabase.</Text>
          </View>
        ) : null}
        {loadingCore || eventsLoading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} /> : null}

        <View style={styles.metrics}>
          {isAdmin ? <AdminMetricCard icon="sun" label="Ventas de hoy" value={formatMoney(salesSummary.today)} accent="#22C55E" /> : null}
          {isAdmin ? <AdminMetricCard icon="trending-up" label="Ventas del mes" value={formatMoney(salesSummary.month)} accent={colors.primary} /> : null}
          <AdminMetricCard icon="users" label="Clientes" value={customers.length} accent="#3B82F6" />
          <AdminMetricCard icon="alert-triangle" label="Bajo stock" value={lowStock.length} accent="#F59E0B" />
          <AdminMetricCard icon="calendar" label="Próximos eventos" value={upcomingEvents.length} accent="#A855F7" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accesos rápidos</Text>
        <View style={styles.actions}>
          {isAdmin ? <AdminQuickAction icon="shopping-cart" label="Nueva venta" onPress={() => router.push("/sales?create=1" as never)} /> : null}
          {isAdmin ? <AdminQuickAction icon="clipboard" label="Pedidos y ventas" onPress={() => router.push("/sales" as never)} /> : null}
          <AdminQuickAction icon="user-plus" label="Nuevo cliente" onPress={() => router.push("/clients" as never)} />
          <AdminQuickAction icon="calendar" label="Calendario" onPress={() => router.push("/calendar?create=1" as never)} />
          <AdminQuickAction icon="package" label="Inventario" onPress={() => router.push("/inventory" as never)} />
          {isAdmin ? <AdminQuickAction icon="bar-chart-2" label="Reportes" onPress={() => router.push("/reports" as never)} /> : null}
        </View>

        <View style={styles.columns}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.panelHeader}><Text style={[styles.panelTitle, { color: colors.foreground }]}>Clientes recientes</Text><Pressable onPress={() => router.push("/clients" as never)}><Text style={[styles.link, { color: colors.primary }]}>Ver clientes</Text></Pressable></View>
            {recentCustomers.map((customer) => <Pressable key={customer.id} onPress={() => router.push(`/customer/${customer.id}` as never)} style={[styles.customerRow, { borderBottomColor: colors.border }]}><View style={[styles.customerIcon, { backgroundColor: colors.primary + "18" }]}><Feather name="user" size={16} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.customerName, { color: colors.foreground }]}>{customer.name}</Text><Text style={[styles.customerMeta, { color: colors.mutedForeground }]}>{customer.phone || customer.email || "Sin contacto"}</Text></View><Feather name="chevron-right" size={16} color={colors.mutedForeground} /></Pressable>)}
            {!recentCustomers.length ? <Empty text="Aún no hay clientes registrados." /> : null}
          </View>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.panelHeader}><Text style={[styles.panelTitle, { color: colors.foreground }]}>Próximos eventos</Text><Pressable onPress={() => router.push("/calendar" as never)}><Text style={[styles.link, { color: colors.primary }]}>Abrir calendario</Text></Pressable></View>
            {upcomingEvents.map((event) => <EventCard key={event.id} event={event} onEdit={() => router.push("/calendar" as never)} />)}
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
  customerRow: { minHeight: 58, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  customerIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  customerName: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  customerMeta: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
