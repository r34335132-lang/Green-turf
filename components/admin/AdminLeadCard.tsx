import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LeadRow } from "@/lib/leads";
import { StaffMember } from "@/lib/staff";
import { useColors } from "@/hooks/useColors";
import { displayMexicanPhone } from "@/lib/phone";

const STATUS: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "#A855F7" },
  pendiente: { label: "Pendiente", color: "#EF4444" },
  contactado: { label: "Contactado", color: "#3B82F6" },
  cotizado: { label: "Cotizado", color: "#F59E0B" },
  ganado: { label: "Ganado", color: "#22C55E" },
  perdido: { label: "Perdido", color: "#6B7280" },
  cerrado: { label: "Cerrado", color: "#22C55E" },
  descartado: { label: "Descartado", color: "#6B7280" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

type Props = {
  item: LeadRow;
  vendorMap: Record<string, string>;
  isAdmin: boolean;
  onAdvanceStatus: () => void;
  onAssign: () => void;
};

export function AdminLeadCard({
  item,
  vendorMap,
  isAdmin,
  onAdvanceStatus,
  onAssign,
}: Props) {
  const colors = useColors();
  const status = STATUS[item.status] || STATUS.pendiente;
  const assigneeName = item.assigned_to
    ? vendorMap[item.assigned_to] ||
      `${item.assigned_profile?.first_name || ""} ${item.assigned_profile?.last_name || ""}`.trim() ||
      "Vendedor"
    : null;
  const dateLabel = item.created_at
    ? new Date(item.created_at).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: status.color,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: status.color + "30" }]}>
          <Text style={[styles.avatarText, { color: status.color }]}>
            {initials(item.client_name || "?")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.foreground }]}>{item.client_name}</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateLabel}</Text>
        </View>
        <Pressable
          onPress={onAdvanceStatus}
          style={[styles.statusPill, { backgroundColor: status.color + "22", borderColor: status.color }]}
        >
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </Pressable>
      </View>

      <View style={[styles.infoGrid, { backgroundColor: colors.background }]}>
        <InfoRow icon="phone" text={displayMexicanPhone(item.phone) || "—"} colors={colors} />
        <InfoRow icon="mail" text={item.email || "—"} colors={colors} />
        <InfoRow icon="layers" text={item.products?.name || "Pasto"} colors={colors} />
        {(item.m2_requested ?? 0) > 0 ? (
          <InfoRow icon="maximize" text={`${item.m2_requested} m² solicitados`} colors={colors} />
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.assignBadge, { borderColor: colors.border }]}>
          <Feather name="user" size={12} color={colors.primary} />
          <Text style={[styles.assignText, { color: colors.mutedForeground }]}>
            {assigneeName ? assigneeName : "Sin vendedor asignado"}
          </Text>
        </View>
        {isAdmin ? (
          <Pressable
            onPress={onAssign}
            style={[styles.assignBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="user-plus" size={14} color="#000" />
            <Text style={styles.assignBtnText}>Asignar</Text>
          </Pressable>
        ) : null}
      </View>

      {item.notes ? (
        <Text style={[styles.notes, { color: colors.mutedForeground }]}>{item.notes}</Text>
      ) : null}
    </View>
  );
}

function InfoRow({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={[styles.infoText, { color: colors.foreground }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 14,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  name: { fontFamily: "Inter_700Bold", fontSize: 17 },
  date: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  infoGrid: { marginTop: 14, padding: 12, borderRadius: 12, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  assignBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  assignText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  assignBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#000" },
  notes: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
    fontStyle: "italic",
  },
});
