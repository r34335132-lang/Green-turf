import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AddButton,
  EditorModal,
  EmptyState,
  ErrorState,
  Input,
  Label,
  SaveButton,
} from "@/app/admin/notes";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminShell } from "@/components/admin/AdminShell";
import { PhoneInput } from "@/components/PhoneInput";
import { getAdminProducts } from "@/data/products";
import { useColors } from "@/hooks/useColors";
import {
  Customer,
  Sale,
  SaleItemInput,
  addSaleExpense,
  createCustomer,
  createSale,
  formatMoney,
  getCustomers,
  getSales,
  saleExpenseTotal,
  saleProfit,
  summarizeSales,
  addSalePayment,
} from "@/lib/sales";

const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Tarjeta", "Crédito"];
const EXPENSE_CATEGORIES = ["Mantenimiento", "Instalación", "Material", "Mano de obra", "Entrega", "Otro"];
const today = new Date().toISOString().slice(0, 10);

type ProductOption = {
  id: string;
  name: string;
  price_per_m2?: number;
};

const blankItem = (): SaleItemInput => ({
  product_id: null,
  item_type: "producto",
  description: "",
  quantity: 1,
  unit_price: 0,
  discount: 0,
});

export default function AdminSalesScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ create?: string }>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [saleDate, setSaleDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentStatus, setPaymentStatus] = useState("pagado");
  const [saleDiscount, setSaleDiscount] = useState("0");
  const [appliesIva, setAppliesIva] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItemInput[]>([blankItem()]);
  const [saving, setSaving] = useState(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState("Efectivo");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [editPaymentNotes, setEditPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [expenseSale, setExpenseSale] = useState<Sale | null>(null);
  const [expenseCategory, setExpenseCategory] = useState("Instalación");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [salesResult, customersResult, productsResult] = await Promise.allSettled([
      getSales(),
      getCustomers(),
      getAdminProducts(),
    ]);
    if (salesResult.status === "fulfilled") setSales(salesResult.value);
    else setError(salesResult.reason?.message || "No se pudieron cargar las ventas.");
    setCustomers(customersResult.status === "fulfilled" ? customersResult.value : []);
    setProducts(
      productsResult.status === "fulfilled"
        ? (productsResult.value as ProductOption[])
        : []
    );
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = () => {
    setCustomerId(customers[0]?.id || "");
    setNewCustomer(customers.length === 0);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSaleDate(today);
    setPaymentMethod("Efectivo");
    setPaymentStatus("pagado");
    setSaleDiscount("0");
    setAppliesIva(false);
    setAmountPaid("");
    setNotes("");
    setItems([blankItem()]);
    setModal(true);
  };

  useEffect(() => {
    if (params.create === "1" && !loading) open();
  }, [params.create, loading]);

  const subtotal = items.reduce(
    (sum, item) =>
      sum + Math.max(0, item.quantity * item.unit_price - item.discount),
    0
  );
  const taxableBase = Math.max(0, subtotal - Number(saleDiscount || 0));
  const taxAmount = appliesIva ? taxableBase * 0.16 : 0;
  const total = taxableBase + taxAmount;
  const summary = summarizeSales(sales);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return sales;
    return sales.filter((sale) =>
      `${sale.folio} ${sale.sale_date} ${sale.customers?.name || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [sales, search]);

  const patchItem = (index: number, patch: Partial<SaleItemInput>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  const selectProduct = (index: number, product: ProductOption) => {
    patchItem(index, {
      product_id: product.id,
      item_type: "producto",
      description: product.name,
      unit_price: Number(product.price_per_m2 || 0),
    });
  };

  const openPayment = (sale: Sale) => {
    setPaymentSale(sale);
    setEditPaymentMethod(sale.payment_method || "Efectivo");
    setPaymentAmount("");
    setPaymentDate(today);
    setEditPaymentNotes("");
  };

  const savePayment = async () => {
    if (!paymentSale) return;
    const remaining = Math.max(0, Number(paymentSale.total || 0) - Number(paymentSale.amount_paid || 0));
    const amount = Number(paymentAmount || 0);
    if (amount <= 0 || amount > remaining) {
      return Alert.alert("Monto inválido", `El abono debe ser mayor a cero y no superar ${formatMoney(remaining)}.`);
    }
    setSavingPayment(true);
    try {
      await addSalePayment(paymentSale.id, {
        amount,
        payment_method: editPaymentMethod,
        payment_date: paymentDate,
        notes: editPaymentNotes,
      });
      setPaymentSale(null);
      await load();
    } catch (e: any) {
      Alert.alert("No se pudo actualizar el pago", e.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const saveExpense = async () => {
    if (!expenseSale || Number(expenseAmount) <= 0) return;
    setSavingExpense(true);
    try {
      await addSaleExpense(expenseSale.id, {
        category: expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDescription,
      });
      setExpenseSale(null);
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseCategory("Instalación");
      await load();
    } catch (e: any) {
      Alert.alert("No se pudo agregar el gasto", e.message);
    } finally {
      setSavingExpense(false);
    }
  };

  const submit = async () => {
    const validItems = items.filter(
      (item) => item.description.trim() && item.quantity > 0 && item.unit_price >= 0
    );
    if ((!customerId && !newCustomer) || (newCustomer && !customerName.trim())) {
      return Alert.alert("Cliente requerido", "Selecciona o registra un cliente.");
    }
    if (!validItems.length) {
      return Alert.alert("Conceptos requeridos", "Agrega al menos un producto o servicio.");
    }

    setSaving(true);
    try {
      let resolvedCustomerId = customerId;
      if (newCustomer) {
        const created = await createCustomer({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        });
        resolvedCustomerId = created.id;
      }
      await createSale({
        customer_id: resolvedCustomerId,
        sale_date: saleDate,
        discount: Number(saleDiscount || 0),
        applies_iva: appliesIva,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        amount_paid:
          paymentStatus === "pagado"
            ? total
            : Math.min(total, Number(amountPaid || 0)),
        notes,
        items: validItems,
      });
      setModal(false);
      await load();
      Alert.alert("Venta registrada", "La venta y sus conceptos quedaron guardados.");
    } catch (e: any) {
      Alert.alert("No se pudo registrar la venta", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Registro de ventas"
      subtitle="Captura operaciones, consulta folios y controla pagos por cliente."
      action={<AddButton onPress={open} />}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? (
          <ErrorState message="Falta activar clientes y ventas. Ejecuta supabase/admin-sales.sql." />
        ) : null}
        <View style={styles.metrics}>
          <AdminMetricCard icon="sun" label="Ventas de hoy" value={formatMoney(summary.today)} accent="#22C55E" />
          <AdminMetricCard icon="calendar" label="Esta semana" value={formatMoney(summary.week)} accent="#3B82F6" />
          <AdminMetricCard icon="trending-up" label="Este mes" value={formatMoney(summary.month)} accent={colors.primary} />
          <AdminMetricCard icon="clock" label="Pendiente de cobro" value={formatMoney(summary.pending)} accent="#F59E0B" />
          <AdminMetricCard icon="dollar-sign" label="Utilidad neta" value={formatMoney(summary.profit)} accent="#14B8A6" />
        </View>

        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por cliente, fecha o folio..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {!loading && filtered.map((sale) => (
          <View key={sale.id} style={[styles.saleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(() => {
              const expenses = saleExpenseTotal(sale);
              const profit = saleProfit(sale);
              const pending = Math.max(0, Number(sale.total || 0) - Number(sale.amount_paid || 0));
              return (
                <>
            <View style={styles.saleTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.customer, { color: colors.foreground }]}>{sale.customers?.name || "Cliente"}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{sale.folio} · {sale.sale_date.split("-").reverse().join("/")}</Text>
              </View>
              <Text style={[styles.total, { color: colors.primary }]}>{formatMoney(Number(sale.total))}</Text>
            </View>
            <View style={styles.saleBottom}>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{sale.sale_items?.length || 0} concepto(s) · {sale.payment_method}</Text>
              <View style={[styles.status, { backgroundColor: sale.payment_status === "pagado" ? "#22C55E20" : "#F59E0B20" }]}>
                <Text style={[styles.statusText, { color: sale.payment_status === "pagado" ? "#22C55E" : "#F59E0B" }]}>{sale.payment_status}</Text>
              </View>
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground, marginTop: 8 }]}>Pendiente: {formatMoney(pending)}</Text>
            <View style={styles.profitRow}>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Gastos: {formatMoney(expenses)}</Text>
              <Text style={[styles.profitText, { color: profit >= 0 ? "#22C55E" : "#EF4444" }]}>Ganancia: {formatMoney(profit)}</Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable disabled={pending <= 0} onPress={() => openPayment(sale)} style={[styles.smallAction, { borderColor: colors.border, opacity: pending <= 0 ? 0.45 : 1 }]}><Feather name="credit-card" size={14} color={colors.primary} /><Text style={[styles.smallActionText, { color: colors.primary }]}>Agregar abono</Text></Pressable>
              <Pressable onPress={() => { setExpenseSale(sale); setExpenseAmount(""); setExpenseDescription(""); }} style={[styles.smallAction, { borderColor: colors.border }]}><Feather name="minus-circle" size={14} color={colors.primary} /><Text style={[styles.smallActionText, { color: colors.primary }]}>Agregar gasto</Text></Pressable>
            </View>
            {sale.sale_payments?.length ? (
              <View style={[styles.paymentHistory, { borderTopColor: colors.border }]}>
                <Text style={[styles.paymentHistoryTitle, { color: colors.foreground }]}>Historial de pagos</Text>
                {[...sale.sale_payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at)).map((payment) => (
                  <View key={payment.id} style={styles.paymentRow}>
                    <View style={styles.paymentIcon}><Feather name="check" size={12} color="#22C55E" /></View>
                    <View style={styles.flex}>
                      <Text style={[styles.paymentMethod, { color: colors.foreground }]}>{payment.payment_method}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{payment.payment_date.split("-").reverse().join("/")}{payment.notes ? ` · ${payment.notes}` : ""}</Text>
                    </View>
                    <Text style={styles.paymentAmount}>{formatMoney(Number(payment.amount))}</Text>
                  </View>
                ))}
              </View>
            ) : null}
                </>
              );
            })()}
          </View>
        ))}
        {!loading && !filtered.length ? <EmptyState icon="shopping-cart" title="Sin ventas registradas" text="Usa Nueva venta para comenzar el historial comercial." /> : null}
      </ScrollView>

      <EditorModal visible={modal} onClose={() => setModal(false)} title="Nueva venta">
        <View style={styles.toggleRow}>
          <Pressable onPress={() => setNewCustomer(false)} style={[styles.toggle, { borderColor: !newCustomer ? colors.primary : colors.border }]}>
            <Text style={{ color: !newCustomer ? colors.primary : colors.mutedForeground }}>Cliente existente</Text>
          </Pressable>
          <Pressable onPress={() => setNewCustomer(true)} style={[styles.toggle, { borderColor: newCustomer ? colors.primary : colors.border }]}>
            <Text style={{ color: newCustomer ? colors.primary : colors.mutedForeground }}>Registrar cliente</Text>
          </Pressable>
        </View>
        {newCustomer ? (
          <>
            <Label text="Nombre del cliente *" /><Input value={customerName} onChangeText={setCustomerName} />
            <Label text="Clave lada y número" /><PhoneInput value={customerPhone} onChangeText={setCustomerPhone} />
            <Label text="Correo" /><Input value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" autoCapitalize="none" />
          </>
        ) : (
          <>
            <Label text="Selecciona cliente *" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
              {customers.map((customer) => (
                <Choice key={customer.id} selected={customerId === customer.id} label={customer.name} onPress={() => setCustomerId(customer.id)} />
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.two}>
          <View style={styles.flex}><Label text="Fecha" /><Input value={saleDate} onChangeText={setSaleDate} /></View>
          <View style={styles.flex}><Label text="Descuento general" /><Input value={saleDiscount} onChangeText={(value) => setSaleDiscount(numeric(value))} keyboardType="decimal-pad" /></View>
        </View>
        <Label text="IVA" />
        <View style={styles.choices}>
          <Choice selected={!appliesIva} label="Sin IVA" onPress={() => setAppliesIva(false)} />
          <Choice selected={appliesIva} label="Agregar IVA 16%" onPress={() => setAppliesIva(true)} />
        </View>

        <Label text="Productos o servicios" />
        {items.map((item, index) => (
          <View key={index} style={[styles.itemBox, { borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Concepto {index + 1}</Text>
              {items.length > 1 ? <Pressable onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Feather name="trash-2" size={17} color="#EF4444" /></Pressable> : null}
            </View>
            <View style={styles.choices}>
              <Choice selected={item.item_type === "producto"} label="Producto" onPress={() => patchItem(index, { item_type: "producto" })} />
              <Choice selected={item.item_type === "servicio"} label="Servicio" onPress={() => patchItem(index, { item_type: "servicio", product_id: null })} />
            </View>
            {item.item_type === "producto" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                {products.map((product) => <Choice key={product.id} selected={item.product_id === product.id} label={product.name} onPress={() => selectProduct(index, product)} />)}
              </ScrollView>
            ) : null}
            <Input value={item.description} onChangeText={(value) => patchItem(index, { description: value })} placeholder="Descripción del concepto" />
            <View style={styles.three}>
              <View style={styles.flex}><Label text="Cantidad" /><Input value={String(item.quantity)} onChangeText={(value) => patchItem(index, { quantity: Number(numeric(value)) })} keyboardType="decimal-pad" /></View>
              <View style={styles.flex}><Label text="Precio unitario" /><Input value={String(item.unit_price)} onChangeText={(value) => patchItem(index, { unit_price: Number(numeric(value)) })} keyboardType="decimal-pad" /></View>
              <View style={styles.flex}><Label text="Descuento" /><Input value={String(item.discount)} onChangeText={(value) => patchItem(index, { discount: Number(numeric(value)) })} keyboardType="decimal-pad" /></View>
            </View>
          </View>
        ))}
        <Pressable onPress={() => setItems((current) => [...current, blankItem()])} style={[styles.addItem, { borderColor: colors.primary }]}>
          <Feather name="plus" size={16} color={colors.primary} /><Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Agregar concepto</Text>
        </Pressable>

        <Label text="Método de pago" />
        <View style={styles.choices}>{PAYMENT_METHODS.map((method) => <Choice key={method} selected={paymentMethod === method} label={method} onPress={() => setPaymentMethod(method)} />)}</View>
        <Label text="Estado del pago" />
        <View style={styles.choices}>
          <Choice selected={paymentStatus === "pagado"} label="Pagado" onPress={() => setPaymentStatus("pagado")} />
          <Choice selected={paymentStatus === "pendiente"} label="Pendiente" onPress={() => setPaymentStatus("pendiente")} />
          <Choice selected={paymentStatus === "parcial"} label="Pago parcial" onPress={() => setPaymentStatus("parcial")} />
        </View>
        {paymentStatus !== "pagado" ? <><Label text="Monto pagado" /><Input value={amountPaid} onChangeText={(value) => setAmountPaid(numeric(value))} keyboardType="decimal-pad" /></> : null}
        <Label text="Notas internas" /><Input value={notes} onChangeText={setNotes} multiline placeholder="Acuerdos, entrega, referencia de pago..." />
        <View style={[styles.totalBox, { backgroundColor: colors.background }]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Subtotal después de descuento</Text>
            <Text style={[styles.taxLine, { color: colors.mutedForeground }]}>
              {formatMoney(taxableBase)} · IVA {appliesIva ? formatMoney(taxAmount) : "No aplica"}
            </Text>
          </View>
          <View style={styles.totalRight}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
            <Text style={[styles.totalBig, { color: colors.primary }]}>{formatMoney(total)}</Text>
          </View>
        </View>
        <SaveButton label="Registrar venta" saving={saving} disabled={total <= 0} onPress={submit} />
      </EditorModal>

      <EditorModal visible={!!paymentSale} onClose={() => setPaymentSale(null)} title={`Agregar abono · ${paymentSale?.folio || ""}`}>
        <View style={[styles.balanceBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Saldo pendiente</Text>
          <Text style={[styles.totalBig, { color: "#F59E0B" }]}>{formatMoney(Math.max(0, Number(paymentSale?.total || 0) - Number(paymentSale?.amount_paid || 0)))}</Text>
        </View>
        <Label text="Monto del abono *" /><Input value={paymentAmount} onChangeText={(value) => setPaymentAmount(numeric(value))} keyboardType="decimal-pad" />
        <Label text="Fecha del pago" /><Input value={paymentDate} onChangeText={setPaymentDate} placeholder="AAAA-MM-DD" />
        <Label text="Método de pago" />
        <View style={styles.choices}>{PAYMENT_METHODS.map((method) => <Choice key={method} selected={editPaymentMethod === method} label={method} onPress={() => setEditPaymentMethod(method)} />)}</View>
        <Label text="Nota o referencia" /><Input value={editPaymentNotes} onChangeText={setEditPaymentNotes} multiline placeholder="Ej. transferencia 4821, segundo abono..." />
        <SaveButton label="Guardar abono" saving={savingPayment} disabled={Number(paymentAmount) <= 0} onPress={savePayment} />
      </EditorModal>

      <EditorModal visible={!!expenseSale} onClose={() => setExpenseSale(null)} title={`Gasto Â· ${expenseSale?.folio || ""}`}>
        <Label text="Tipo de gasto" />
        <View style={styles.choices}>{EXPENSE_CATEGORIES.map((category) => <Choice key={category} selected={expenseCategory === category} label={category} onPress={() => setExpenseCategory(category)} />)}</View>
        <Label text="Monto *" /><Input value={expenseAmount} onChangeText={(value) => setExpenseAmount(numeric(value))} keyboardType="decimal-pad" />
        <Label text="Detalle" /><Input value={expenseDescription} onChangeText={setExpenseDescription} multiline placeholder="Ej. gasolina, cuadrilla, mantenimiento, instalaciÃ³n..." />
        <SaveButton label="Guardar gasto" saving={savingExpense} disabled={Number(expenseAmount) <= 0} onPress={saveExpense} />
      </EditorModal>
    </AdminShell>
  );
}

function numeric(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

function Choice({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.choice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + "18" : "transparent" }]}><Text numberOfLines={1} style={[styles.choiceText, { color: selected ? colors.primary : colors.mutedForeground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1200, width: "100%", alignSelf: "center" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  search: { height: 46, maxWidth: 560, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, marginBottom: 16 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
  saleCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 10 },
  saleTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  customer: { fontFamily: "Inter_700Bold", fontSize: 16 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 },
  total: { fontFamily: "Inter_700Bold", fontSize: 18 },
  saleBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  profitRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 10 },
  profitText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  smallAction: { minHeight: 34, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  smallActionText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  paymentHistory: { borderTopWidth: 1, marginTop: 14, paddingTop: 12, gap: 9 },
  paymentHistoryTitle: { fontFamily: "Inter_700Bold", fontSize: 12 },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  paymentIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#22C55E20", alignItems: "center", justifyContent: "center" },
  paymentMethod: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  paymentAmount: { color: "#22C55E", fontFamily: "Inter_700Bold", fontSize: 12 },
  balanceBox: { borderRadius: 13, padding: 14, marginBottom: 14 },
  status: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "capitalize" },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  toggle: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  choice: { maxWidth: 180, borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
  choiceText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  two: { flexDirection: "row", gap: 10 },
  three: { flexDirection: "row", gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  itemBox: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  itemTitle: { fontFamily: "Inter_700Bold", fontSize: 13 },
  addItem: { height: 42, borderRadius: 11, borderWidth: 1, borderStyle: "dashed", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 16 },
  totalBox: { borderRadius: 13, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  totalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  taxLine: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  totalRight: { alignItems: "flex-end" },
  totalBig: { fontFamily: "Inter_700Bold", fontSize: 21 },
});
