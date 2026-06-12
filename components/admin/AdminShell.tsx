import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React, { ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid" as const, route: "/admin" },
  { label: "Notas", icon: "file-text" as const, route: "/admin/notes" },
  { label: "Calendario", icon: "calendar" as const, route: "/admin/calendar" },
  { label: "Tareas", icon: "check-square" as const, route: "/admin/tasks" },
  { label: "Inventario", icon: "package" as const, route: "/admin/inventory" },
  { label: "Clientes", icon: "users" as const, route: "/admin/clients" },
  { label: "Equipo", icon: "briefcase" as const, route: "/admin/team" },
];

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function AdminShell({ title, subtitle, children, action }: Props) {
  const colors = useColors();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  const navigate = (route: string) => router.replace(route as never);
  const active = (route: string) =>
    route === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(route);

  const nav = (
    <>
      {NAV_ITEMS.map((item) => {
        const selected = active(item.route);
        return (
          <Pressable
            key={item.route}
            onPress={() => navigate(item.route)}
            style={[
              desktop ? styles.sideItem : styles.bottomItem,
              selected && { backgroundColor: colors.primary + "1F" },
            ]}
          >
            <Feather
              name={item.icon}
              size={desktop ? 18 : 19}
              color={selected ? colors.primary : colors.mutedForeground}
            />
            <Text
              numberOfLines={1}
              style={[
                desktop ? styles.sideLabel : styles.bottomLabel,
                { color: selected ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {desktop ? (
        <View
          style={[
            styles.sidebar,
            {
              paddingTop: insets.top + 24,
              backgroundColor: colors.card,
              borderRightColor: colors.border,
            },
          ]}
        >
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Text style={styles.brandLetter}>G</Text>
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>GREEN TURF</Text>
              <Text style={[styles.brandSub, { color: colors.primary }]}>OPERACIONES</Text>
            </View>
          </View>
          <View style={styles.sideNav}>{nav}</View>
          <Pressable onPress={() => router.replace("/(tabs)" as never)} style={styles.storeLink}>
            <Feather name="arrow-left" size={17} color={colors.mutedForeground} />
            <Text style={[styles.sideLabel, { color: colors.mutedForeground }]}>Volver a la tienda</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.main}>
        <View
          style={[
            styles.header,
            {
              paddingTop: desktop ? 24 : insets.top + 12,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>CENTRO OPERATIVO</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
            ) : null}
          </View>
          {action}
        </View>
        <View style={[styles.content, !desktop && { paddingBottom: insets.bottom + 76 }]}>
          {children}
        </View>
      </View>

      {!desktop ? (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomNav}>
            {nav}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  sidebar: { width: 238, borderRightWidth: 1, paddingHorizontal: 16, paddingBottom: 20 },
  brand: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, marginBottom: 28 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brandLetter: { color: "#071000", fontFamily: "Inter_700Bold", fontSize: 21 },
  brandName: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 1 },
  brandSub: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1.6, marginTop: 2 },
  sideNav: { flex: 1, gap: 5 },
  sideItem: { height: 46, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14 },
  sideLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  storeLink: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  main: { flex: 1, minWidth: 0 },
  header: { minHeight: 108, paddingHorizontal: 24, paddingBottom: 18, borderBottomWidth: 1, flexDirection: "row", alignItems: "flex-end", gap: 16 },
  headerCopy: { flex: 1 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: Platform.OS === "web" ? 28 : 24, letterSpacing: -0.6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 5 },
  content: { flex: 1 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1 },
  bottomNav: { paddingHorizontal: 8, paddingTop: 7, gap: 2 },
  bottomItem: { width: 82, paddingVertical: 6, borderRadius: 10, alignItems: "center", gap: 3 },
  bottomLabel: { fontFamily: "Inter_600SemiBold", fontSize: 9 },
});

