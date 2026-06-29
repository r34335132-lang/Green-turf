import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminShell } from "@/components/admin/AdminShell";
import { useColors } from "@/hooks/useColors";
import { Sale, formatMoney, getSales, summarizeSales } from "@/lib/sales";

export default function AdminReportsScreen() {
  const colors = useColors();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getSales().then(setSales).catch(() => setSales([])).finally(() => setLoading(false));
  }, []));

  const summary = summarizeSales(sales);
  const byCustomer = useMemo(() => {
    const totals = new Map<string, { name: string; total: number; count: number }>();
    sales.forEach((sale) => {
      const key = sale.customer_id;
      const current = totals.get(key) || { name: sale.customers?.name || "Cliente", total: 0, count: 0 };
      current.total += Number(sale.total || 0);
      current.count += 1;
      totals.set(key, current);
    });
    return [...totals.values()].sort((a, b) => b.total - a.total);
  }, [sales]);

  return (
    <AdminShell title="Reportes" subtitle="Resumen comercial para tomar decisiones rápidas.">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.metrics}>
          <AdminMetricCard icon="sun" label="Hoy" value={formatMoney(summary.today)} accent="#22C55E" />
          <AdminMetricCard icon="calendar" label="Semana" value={formatMoney(summary.week)} accent="#3B82F6" />
          <AdminMetricCard icon="trending-up" label="Mes" value={formatMoney(summary.month)} accent={colors.primary} />
          <AdminMetricCard icon="clock" label="Por cobrar" value={formatMoney(summary.pending)} accent="#F59E0B" />
        </View>
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heading}><Feather name="users" size={19} color={colors.primary} /><Text style={[styles.title, { color: colors.foreground }]}>Venta acumulada por cliente</Text></View>
          {loading ? <ActivityIndicator color={colors.primary} /> : byCustomer.map((customer, index) => (
            <View key={`${customer.name}-${index}`} style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}><Text style={[styles.name, { color: colors.foreground }]}>{customer.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{customer.count} venta(s)</Text></View>
              <Text style={[styles.amount, { color: colors.primary }]}>{formatMoney(customer.total)}</Text>
            </View>
          ))}
          {!loading && !byCustomer.length ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>Los indicadores aparecerán al registrar ventas.</Text> : null}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1100, width: "100%", alignSelf: "center" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  panel: { borderRadius: 18, borderWidth: 1, padding: 16 },
  heading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16 },
  row: { minHeight: 62, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  empty: { paddingVertical: 30, textAlign: "center", fontFamily: "Inter_500Medium" },
});
