import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  isAdmin: boolean;
  onClose: () => void;
};

type Action = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  route: string;
  adminOnly?: boolean;
};

const ACTIONS: Action[] = [
  { icon: "package", label: "Agregar pasto", sub: "Nuevo producto al catálogo", route: "/admin/add-product" },
  { icon: "user-plus", label: "Agregar vendedor", sub: "Crear o promover cuenta", route: "/admin/add-vendor", adminOnly: true },
  { icon: "gift", label: "Enviar promoción", sub: "Notificar a todos los clientes", route: "/admin/send-promo", adminOnly: true },
  { icon: "tool", label: "Mantenimiento", sub: "Solicitudes y registros", route: "/admin/maintenance" },
];

export function AdminQuickActionsModal({ visible, isAdmin, onClose }: Props) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Acciones rápidas</Text>
          {ACTIONS.filter((a) => !a.adminOnly || isAdmin).map((action) => (
            <Pressable
              key={action.route}
              onPress={() => {
                onClose();
                router.push(action.route as any);
              }}
              style={[styles.row, { borderColor: colors.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
                <Feather name={action.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.foreground }]}>{action.label}</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>{action.sub}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cerrar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: "Inter_700Bold", fontSize: 15 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  cancel: { alignItems: "center", paddingTop: 16 },
});
