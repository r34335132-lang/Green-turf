import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { StaffMember } from "@/lib/staff";
import { LeadRow } from "@/lib/leads";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  lead: LeadRow | null;
  vendors: StaffMember[];
  loading?: boolean;
  onClose: () => void;
  onAssign: (vendorId: string | null) => void;
};

export function AssignVendorModal({
  visible,
  lead,
  vendors,
  loading,
  onClose,
  onAssign,
}: Props) {
  const colors = useColors();
  if (!lead) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Asignar vendedor</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Cotización de {lead.client_name}
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => onAssign(null)}
              disabled={loading}
              style={[styles.option, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Feather name="user-x" size={18} color={colors.mutedForeground} />
              <Text style={[styles.optionText, { color: colors.foreground }]}>Sin asignar</Text>
            </Pressable>

            {vendors
              .filter((v) => v.role === "vendedor" || v.role === "admin")
              .map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => onAssign(v.id)}
                  disabled={loading}
                  style={[
                    styles.option,
                    {
                      borderColor: lead.assigned_to === v.id ? colors.primary : colors.border,
                      backgroundColor:
                        lead.assigned_to === v.id ? colors.primary + "18" : colors.background,
                    },
                  ]}
                >
                  <Feather name="user-check" size={18} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{v.label}</Text>
                  {lead.assigned_to === v.id ? (
                    <Feather name="check" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
          </ScrollView>

          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : null}

          <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: "70%",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, marginBottom: 16 },
  list: { maxHeight: 280 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
});
