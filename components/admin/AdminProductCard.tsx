import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  item: {
    id: string;
    name: string;
    height: number;
    price_per_m2: number;
    is_paused?: boolean;
    categories?: { name?: string } | null;
  };
  onTogglePause: () => void;
  onDelete: () => void;
};

export function AdminProductCard({ item, onTogglePause, onDelete }: Props) {
  const colors = useColors();
  const paused = Boolean(item.is_paused);

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
