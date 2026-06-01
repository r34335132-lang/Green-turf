import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  item: {
    id: string;
    name: string;
    height: number;
    price_per_m2: number;
    is_paused?: boolean;
    stock?: number;
    categories?: { name?: string } | null;
  };
  onTogglePause: () => void;
  onDelete: () => void;
  onUpdateStock?: (id: string, newStock: number) => Promise<void>;
};

export function AdminProductCard({ item, onTogglePause, onDelete, onUpdateStock }: Props) {
  const colors = useColors();
  const paused = Boolean(item.is_paused);
  
  // Estado local para manejar el input del inventario
  const [stockValue, setStockValue] = useState(item.stock?.toString() || "0");
  const [savingStock, setSavingStock] = useState(false);

  // Verificamos si el valor del input es diferente al de la base de datos
  const hasStockChanged = stockValue !== (item.stock?.toString() || "0");

  const handleSaveStock = async () => {
    if (!onUpdateStock) return;
    setSavingStock(true);
    // Se ejecuta la función UPDATE enviada desde el panel principal
    await onUpdateStock(item.id, Number(stockValue));
    setSavingStock(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.thumb, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="layers" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {item.categories?.name || "General"} · {item.height}mm
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.price, { color: colors.primary }]}>${item.price_per_m2}</Text>
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>/m²</Text>
        </View>
      </View>

      {/* NUEVA SECCIÓN: Control de Bodega (Stock) */}
      <View style={[styles.stockRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.stockLabel, { color: colors.foreground }]}>En bodega:</Text>
        <View style={styles.stockInputContainer}>
          <TextInput
            style={[
              styles.stockInput, 
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }
            ]}
            value={stockValue}
            onChangeText={setStockValue}
            keyboardType="numeric"
            selectTextOnFocus
          />
          {hasStockChanged && (
            <Pressable 
              onPress={handleSaveStock} 
              style={[styles.saveStockBtn, { backgroundColor: colors.primary }]}
              disabled={savingStock}
            >
              {savingStock ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Feather name="check" size={16} color="#000" />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {paused ? (
        <View style={[styles.pausedTag, { backgroundColor: "#F59E0B20" }]}>
          <Text style={{ color: "#F59E0B", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
            PAUSADO — no visible en catálogo
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={onTogglePause}
          style={[styles.btn, { backgroundColor: paused ? "#22C55E18" : "#F59E0B18" }]}
        >
          <Feather name={paused ? "play" : "pause"} size={14} color={paused ? "#22C55E" : "#F59E0B"} />
          <Text style={[styles.btnText, { color: paused ? "#22C55E" : "#F59E0B" }]}>
            {paused ? "Activar" : "Pausar"}
          </Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.btn, { backgroundColor: "#EF444418" }]}>
          <Feather name="trash-2" size={14} color="#EF4444" />
          <Text style={[styles.btnText, { color: "#EF4444" }]}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 16 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  price: { fontFamily: "Inter_700Bold", fontSize: 18 },
  unit: { fontFamily: "Inter_400Regular", fontSize: 11 },
  
  // Estilos de Stock
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stockLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  stockInputContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  stockInput: {
    width: 80,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  saveStockBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  pausedTag: { marginTop: 10, padding: 8, borderRadius: 8, alignSelf: "flex-start" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});