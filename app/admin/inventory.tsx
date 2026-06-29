import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryProduct, InventoryProductCard } from "@/components/admin/InventoryProductCard";
import { getAdminProducts } from "@/data/products";
import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { fetchMyProfile } from "@/lib/profile";
import { EditorModal, EmptyState, ErrorState, Input, Label, SaveButton } from "@/app/admin/notes";

const TYPES = ["Entrada", "Salida", "Ajuste", "Venta", "Devolución"];

export default function AdminInventoryScreen() {
  const colors = useColors();
  const { movements, error: movementsError, register } = useInventoryMovements();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [movementModal, setMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [movementType, setMovementType] = useState("Entrada");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [takenBy, setTakenBy] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [savingMovement, setSavingMovement] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [priceProduct, setPriceProduct] = useState<InventoryProduct | null>(null);
  const [price, setPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedProducts, profile] = await Promise.all([getAdminProducts(), fetchMyProfile()]);
      setProducts(loadedProducts as unknown as InventoryProduct[]);
      setIsAdmin(profile?.role === "admin");
    } catch (e: any) {
      Alert.alert("No se pudo cargar inventario", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateStock = async (product: InventoryProduct, delta: number, type = "Ajuste", movementReason = "Ajuste rápido", meta?: { taken_by?: string; note?: string }) => {
    const next = Math.max(0, Number(product.stock || 0) + delta);
    setSavingId(product.id);
    try {
      const { error } = await supabase.from("products").update({ stock: next }).eq("id", product.id);
      if (error) throw error;
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: next } : item));
      try {
        await register({ product_id: product.id, movement_type: type, quantity: delta, reason: movementReason, taken_by: meta?.taken_by?.trim() || null, note: meta?.note?.trim() || null });
      } catch (movementError: any) {
        Alert.alert("Stock actualizado", `No se pudo registrar el historial: ${movementError.message}`);
      }
    } catch (e: any) {
      Alert.alert("No se pudo actualizar", e.message);
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => products.filter((product) => {
    const stock = Number(product.stock || 0);
    const min = Number(product.min_stock ?? 5);
    const matchesFilter = filter === "todos" || (filter === "agotado" && stock <= 0) || (filter === "bajo" && stock > 0 && stock <= min) || (filter === "disponible" && stock > min);
    return matchesFilter && `${product.name} ${product.categories?.name || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [filter, products, search]);

  const submitMovement = async () => {
    if (!selectedProduct || Number(quantity) <= 0) return;
    const signed = ["Salida", "Venta"].includes(movementType) ? -Number(quantity) : Number(quantity);
    setSavingMovement(true);
    await updateStock(selectedProduct, signed, movementType, reason.trim() || movementType, { taken_by: takenBy, note: movementNote });
    setSavingMovement(false);
    setMovementModal(false);
    setTakenBy("");
    setMovementNote("");
  };

  const submitPrice = async () => {
    if (!priceProduct || Number(price) <= 0) return;
    setSavingPrice(true);
    const { error } = await supabase.from("products").update({ price_per_m2: Number(price) }).eq("id", priceProduct.id);
    setSavingPrice(false);
    if (error) return Alert.alert("No se pudo actualizar el precio", error.message);
    setProducts((current) => current.map((product) => product.id === priceProduct.id ? { ...product, price_per_m2: Number(price) } : product));
    setPriceProduct(null);
  };

  return (
    <AdminShell title="Inventario" subtitle="Stock actual, mínimos y trazabilidad de cada movimiento." action={isAdmin ? <Pressable onPress={() => router.push("/add-product" as never)} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={17} color="#071000" /><Text style={styles.addText}>Producto</Text></Pressable> : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {movementsError ? <ErrorState message="Los cambios de stock funcionan, pero falta activar inventory_movements para guardar el historial." /> : null}
        <View style={styles.toolbar}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={17} color={colors.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar producto..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{["todos", "disponible", "bajo", "agotado"].map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { borderColor: filter === item ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: filter === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}</ScrollView>
        </View>
        <View style={styles.layout}>
          <View style={styles.products}>
            {loading ? <ActivityIndicator color={colors.primary} /> : filtered.map((product) => <View key={product.id}><Pressable onLongPress={() => { setSelectedProduct(product); setMovementModal(true); }}><InventoryProductCard product={product} saving={savingId === product.id} onAdjust={(delta) => updateStock(product, delta)} showPrice={isAdmin} /></Pressable><View style={styles.productLinks}><Pressable onPress={() => { setSelectedProduct(product); setMovementModal(true); }} style={styles.movementLink}><Text style={[styles.linkText, { color: colors.primary }]}>Registrar movimiento</Text></Pressable>{isAdmin ? <Pressable onPress={() => { setPriceProduct(product); setPrice(String(product.price_per_m2 || "")); }} style={styles.movementLink}><Text style={[styles.linkText, { color: colors.primary }]}>Editar precio</Text></Pressable> : null}</View></View>)}
            {!loading && !filtered.length ? <EmptyState icon="package" title="Sin productos" text="No hay productos que coincidan con el filtro." /> : null}
          </View>
          <View style={[styles.history, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>Movimientos recientes</Text>
            {movements.slice(0, 12).map((movement) => {
              const product = products.find((item) => item.id === movement.product_id);
              return <View key={movement.id} style={[styles.movement, { borderBottomColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.movementName, { color: colors.foreground }]}>{product?.name || "Producto eliminado"}</Text><Text style={[styles.movementMeta, { color: colors.mutedForeground }]}>{movement.movement_type} · {movement.reason || "Sin motivo"}</Text>{movement.taken_by ? <Text style={[styles.movementMeta, { color: colors.primary }]}>Se lo llevó: {movement.taken_by}</Text> : null}{movement.note ? <Text style={[styles.movementMeta, { color: colors.mutedForeground }]}>{movement.note}</Text> : null}</View><Text style={[styles.qty, { color: movement.quantity < 0 ? "#EF4444" : "#22C55E" }]}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</Text></View>;
            })}
            {!movements.length ? <EmptyState icon="activity" title="Sin movimientos" text="Los ajustes aparecerán aquí." /> : null}
          </View>
        </View>
      </ScrollView>
      <EditorModal visible={movementModal} onClose={() => setMovementModal(false)} title={`Movimiento · ${selectedProduct?.name || ""}`}>
        <Label text="Tipo" /><View style={styles.filters}>{TYPES.map((item) => <Pressable key={item} onPress={() => setMovementType(item)} style={[styles.filter, { borderColor: movementType === item ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: movementType === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}</View>
        <Label text="Cantidad *" /><Input value={quantity} onChangeText={(value) => setQuantity(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" />
        <Label text="Motivo" /><Input value={reason} onChangeText={setReason} placeholder="Ej. Recepción de proveedor" />
        <Label text="Quién se llevó el producto" /><Input value={takenBy} onChangeText={setTakenBy} placeholder="Colaborador, cliente o cuadrilla" />
        <Label text="Nota del movimiento" /><Input value={movementNote} onChangeText={setMovementNote} multiline placeholder="Ej. Para instalación, mantenimiento o reposición..." />
        <SaveButton label="Registrar movimiento" saving={savingMovement} disabled={Number(quantity) <= 0} onPress={submitMovement} />
      </EditorModal>
      <EditorModal visible={!!priceProduct} onClose={() => setPriceProduct(null)} title={`Precio · ${priceProduct?.name || ""}`}>
        <Label text="Precio por m²" /><Input value={price} onChangeText={(value) => setPrice(value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
        <SaveButton label="Actualizar precio" saving={savingPrice} disabled={Number(price) <= 0} onPress={submitPrice} />
      </EditorModal>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1400, width: "100%", alignSelf: "center" },
  add: { height: 42, paddingHorizontal: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  addText: { color: "#071000", fontFamily: "Inter_700Bold", fontSize: 12 },
  toolbar: { gap: 10, marginBottom: 16 },
  search: { height: 46, maxWidth: 520, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  filter: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },
  layout: { flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "flex-start" },
  products: { minWidth: 310, flex: 2 },
  history: { minWidth: 290, flex: 1, borderRadius: 17, borderWidth: 1, padding: 15 },
  historyTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  movement: { minHeight: 54, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  movementName: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  movementMeta: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3 },
  qty: { fontFamily: "Inter_700Bold", fontSize: 13 },
  movementLink: { alignSelf: "flex-end", marginTop: -5, marginBottom: 10, marginRight: 8 },
  productLinks: { flexDirection: "row", justifyContent: "flex-end", gap: 14 },
  linkText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
});
