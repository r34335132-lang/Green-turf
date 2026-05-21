import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/data/products";
import { useColors } from "@/hooks/useColors";

export default function CalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [waste, setWaste] = useState("10");
  const [selectedId, setSelectedId] = useState(PRODUCTS[0].id);

  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const wasteP = parseFloat(waste) || 0;
  const baseArea = w * h;
  const totalArea = baseArea * (1 + wasteP / 100);
  const product = PRODUCTS.find((p) => p.id === selectedId) ?? PRODUCTS[0];
  const totalCost = totalArea * product.pricePerM2;

  const hasResult = w > 0 && h > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Calculadora</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DIMENSIONES DEL ÁREA
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
              Ancho (m)
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={width}
                onChangeText={setWidth}
                placeholder="0.0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.foreground }]}
              />
              <Text style={[styles.inputUnit, { color: colors.primary }]}>m</Text>
            </View>
          </View>
          <View style={[styles.multiplyIcon, { backgroundColor: colors.card }]}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
              Largo (m)
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder="0.0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.foreground }]}
              />
              <Text style={[styles.inputUnit, { color: colors.primary }]}>m</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          DESPERDICIO
        </Text>
        <View style={styles.wasteRow}>
          {["5", "10", "15", "20"].map((v) => (
            <Pressable
              key={v}
              onPress={() => setWaste(v)}
              style={[
                styles.wasteChip,
                {
                  backgroundColor: waste === v ? colors.primary : colors.card,
                  borderColor: waste === v ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.wasteText,
                  { color: waste === v ? "#000" : colors.foreground },
                ]}
              >
                +{v}%
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          TIPO DE PASTO
        </Text>
        <View style={styles.productList}>
          {PRODUCTS.slice(0, 6).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelectedId(p.id)}
              style={[
                styles.productOption,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedId === p.id ? colors.primary : colors.border,
                  borderWidth: selectedId === p.id ? 2 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, { color: colors.foreground }]}>
                  {p.name}
                </Text>
                <Text style={[styles.productCat, { color: colors.mutedForeground }]}>
                  {p.category} · {p.height}mm
                </Text>
              </View>
              <Text style={[styles.productPrice, { color: colors.primary }]}>
                ${p.pricePerM2}/m²
              </Text>
              {selectedId === p.id && (
                <View style={[styles.check, { backgroundColor: colors.primary }]}>
                  <Feather name="check" size={12} color="#000" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Result */}
        {hasResult && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>
              Presupuesto estimado
            </Text>

            <View style={styles.resultRows}>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                  Área base
                </Text>
                <Text style={[styles.resultValue, { color: colors.foreground }]}>
                  {baseArea.toFixed(1)} m²
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                  Con desperdicio +{waste}%
                </Text>
                <Text style={[styles.resultValue, { color: colors.foreground }]}>
                  {totalArea.toFixed(1)} m²
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                  Precio por m²
                </Text>
                <Text style={[styles.resultValue, { color: colors.foreground }]}>
                  ${product.pricePerM2}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.resultRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>
                  TOTAL
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  ${totalCost.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                addToCart(product, Math.ceil(totalArea));
                router.push("/cart");
              }}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="shopping-bag" size={16} color="#000" />
              <Text style={styles.addBtnText}>
                Agregar al carrito ({Math.ceil(totalArea)} m²)
              </Text>
            </Pressable>
          </View>
        )}

        {!hasResult && (
          <View style={[styles.emptyResult, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="maximize" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Ingresá las medidas para calcular
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5, flex: 1, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  inputGroup: { flex: 1, gap: 8 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22 },
  inputUnit: { fontFamily: "Inter_700Bold", fontSize: 16 },
  multiplyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  wasteRow: { flexDirection: "row", gap: 10 },
  wasteChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  wasteText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  productList: { gap: 10 },
  productOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    position: "relative",
  },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  productCat: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  productPrice: { fontFamily: "Inter_700Bold", fontSize: 15 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  resultCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  resultRows: { gap: 10 },
  resultRow: { flexDirection: "row", justifyContent: "space-between" },
  resultLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  resultValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  divider: { height: 1, marginVertical: 4 },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 16 },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
  emptyResult: {
    height: 140,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
