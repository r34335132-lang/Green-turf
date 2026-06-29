import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminShell } from "@/components/admin/AdminShell";
import { useColors } from "@/hooks/useColors";
import { displayMexicanPhone } from "@/lib/phone";
import { fetchMyProfile } from "@/lib/profile";
import { Customer, Sale, formatMoney, getCustomerSales, getCustomers } from "@/lib/sales";

export default function AdminCustomerDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchMyProfile().then(async (profile) => {
      const admin = profile?.role === "admin";
      setIsAdmin(admin);
      const [allCustomers, customerSales] = await Promise.all([
        getCustomers(),
        admin ? getCustomerSales(id) : Promise.resolve([]),
      ]);
        setCustomer(allCustomers.find((item) => item.id === id) || null);
        setSales(customerSales);
    }).finally(() => setLoading(false));
  }, [id]));

  const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const pending = sales.reduce((sum, sale) => sum + Math.max(0, Number(sale.total || 0) - Number(sale.amount_paid || 0)), 0);
  const products = useMemo(() => {
    const counts = new Map<string, number>();
    sales.flatMap((sale) => sale.sale_items || []).forEach((item) => counts.set(item.description, (counts.get(item.description) || 0) + Number(item.quantity || 0)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sales]);

  return (
    <AdminShell title={customer?.name || "Detalle de cliente"} subtitle="Datos, compras, saldos y contexto comercial en una sola pantalla." action={<Pressable onPress={() => router.back()} style={[styles.back, { borderColor: colors.border }]}><Feather name="arrow-left" size={18} color={colors.primary} /><Text style={[styles.backText, { color: colors.primary }]}>Clientes</Text></Pressable>}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {!loading && customer ? <>
          {isAdmin ? <View style={styles.metrics}>
            <AdminMetricCard icon="dollar-sign" label="Total histórico" value={formatMoney(total)} accent={colors.primary} />
            <AdminMetricCard icon="shopping-bag" label="Ventas realizadas" value={sales.length} accent="#3B82F6" />
            <AdminMetricCard icon="calendar" label="Última compra" value={sales[0]?.sale_date?.split("-").reverse().join("/") || "Sin compras"} accent="#A855F7" />
            <AdminMetricCard icon="clock" label="Pago pendiente" value={formatMoney(pending)} accent="#F59E0B" />
          </View> : null}
          <View style={styles.columns}>
            <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Datos del cliente</Text>
              <Info icon="phone" label="Teléfono" value={displayMexicanPhone(customer.phone) || "Sin teléfono"} />
              <Info icon="mail" label="Correo" value={customer.email || "Sin correo"} />
              <Info icon="map-pin" label="Dirección" value={customer.address || "Sin dirección"} />
              <Info icon="tag" label="Seguimiento" value={customer.customer_status || "cotizando"} />
              <Info icon="file-text" label="Notas" value={customer.notes || "Sin notas internas"} />
              {customer.quotation_image_url ? (
                <View style={styles.quoteBlock}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Foto de la cotización</Text>
                  <Image source={{ uri: customer.quotation_image_url }} style={styles.quoteImage} contentFit="cover" />
                </View>
              ) : null}
            </View>
            {isAdmin ? <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Productos y servicios comprados</Text>
              {products.map(([name, quantity]) => <View key={name} style={[styles.productRow, { borderBottomColor: colors.border }]}><Text style={[styles.productName, { color: colors.foreground }]}>{name}</Text><Text style={[styles.productQty, { color: colors.primary }]}>{quantity}</Text></View>)}
              {!products.length ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>Todavía no tiene conceptos comprados.</Text> : null}
            </View> : null}
          </View>
          {isAdmin ? <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.salesHeader}><Text style={[styles.panelTitle, { color: colors.foreground }]}>Historial de ventas</Text><Pressable onPress={() => router.push("/sales?create=1" as never)}><Text style={[styles.link, { color: colors.primary }]}>Nueva venta</Text></Pressable></View>
            {sales.map((sale) => <View key={sale.id} style={[styles.saleBlock, { borderBottomColor: colors.border }]}><View style={styles.sale}><View style={{ flex: 1 }}><Text style={[styles.saleFolio, { color: colors.foreground }]}>{sale.folio}</Text><Text style={[styles.saleMeta, { color: colors.mutedForeground }]}>{sale.sale_date.split("-").reverse().join("/")} · {sale.payment_status}</Text></View><Text style={[styles.saleTotal, { color: colors.primary }]}>{formatMoney(Number(sale.total))}</Text></View>{sale.sale_payments?.map((payment) => <View key={payment.id} style={styles.paymentRow}><Feather name="check-circle" size={14} color="#22C55E" /><Text style={[styles.paymentText, { color: colors.mutedForeground }]}>{payment.payment_date.split("-").reverse().join("/")} · {payment.payment_method}{payment.notes ? ` · ${payment.notes}` : ""}</Text><Text style={styles.paymentAmount}>{formatMoney(Number(payment.amount))}</Text></View>)}</View>)}
            {!sales.length ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No hay ventas registradas para este cliente.</Text> : null}
          </View> : null}
        </> : null}
      </ScrollView>
    </AdminShell>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.info}><Feather name={icon} size={16} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1200, width: "100%", alignSelf: "center" },
  back: { height: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  panel: { minWidth: 300, flex: 1, borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  panelTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 12 },
  info: { flexDirection: "row", gap: 10, marginBottom: 13 },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 10 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 2 },
  quoteBlock: { gap: 7, marginTop: 4 },
  quoteImage: { width: "100%", height: 220, borderRadius: 14 },
  productRow: { minHeight: 42, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  productName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  productQty: { fontFamily: "Inter_700Bold", fontSize: 12 },
  salesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  saleBlock: { borderBottomWidth: 1, paddingVertical: 10, gap: 8 },
  sale: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 12 },
  saleFolio: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  saleMeta: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3 },
  saleTotal: { fontFamily: "Inter_700Bold", fontSize: 14 },
  paymentRow: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: 8 },
  paymentText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 10 },
  paymentAmount: { color: "#22C55E", fontFamily: "Inter_700Bold", fontSize: 11 },
  empty: { fontFamily: "Inter_400Regular", fontSize: 12, paddingVertical: 16 },
});
