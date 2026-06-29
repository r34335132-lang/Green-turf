import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export type InventoryProduct = {
  id: string;
  name: string;
  image_url?: string | null;
  price_per_m2: number;
  stock: number;
  min_stock?: number;
  categories?: { name?: string } | null;
};

export function InventoryProductCard({ product, saving, onAdjust, showPrice = true }: { product: InventoryProduct; saving?: boolean; onAdjust: (delta: number) => void; showPrice?: boolean }) {
  const colors = useColors();
  const min = product.min_stock ?? 5;
  const state = product.stock <= 0 ? { label: "Agotado", color: "#EF4444" } : product.stock <= min ? { label: "Bajo stock", color: "#F59E0B" } : { label: "Disponible", color: "#22C55E" };
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {product.image_url ? <Image source={product.image_url} style={styles.image} contentFit="cover" /> : <View style={[styles.image, styles.placeholder, { backgroundColor: colors.primary + "18" }]}><Feather name="layers" size={22} color={colors.primary} /></View>}
      <View style={styles.copy}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{product.categories?.name || "General"}{showPrice ? ` · $${product.price_per_m2}/m²` : ""}</Text>
        <Text style={[styles.state, { color: state.color }]}>{state.label} · mínimo {min}</Text>
      </View>
      <View style={styles.control}>
        <Pressable onPress={() => onAdjust(-1)} disabled={saving || product.stock <= 0} style={[styles.button, { borderColor: colors.border }]}><Feather name="minus" size={16} color={colors.foreground} /></Pressable>
        {saving ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={[styles.stock, { color: colors.foreground }]}>{product.stock}</Text>}
        <Pressable onPress={() => onAdjust(1)} disabled={saving} style={[styles.button, { borderColor: colors.border }]}><Feather name="plus" size={16} color={colors.foreground} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  image: { width: 54, height: 54, borderRadius: 12 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0 },
  name: { fontFamily: "Inter_700Bold", fontSize: 14 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  state: { fontFamily: "Inter_700Bold", fontSize: 10, marginTop: 5 },
  control: { flexDirection: "row", alignItems: "center", gap: 9 },
  button: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stock: { minWidth: 26, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 16 },
});
