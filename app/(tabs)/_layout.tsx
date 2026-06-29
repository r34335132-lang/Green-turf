import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Tabs, usePathname } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useCart } from "@/context/CartContext";
import { usePushOnLogin } from "@/hooks/usePushOnLogin";
import { useColors } from "@/hooks/useColors";
import { AppRole, fetchMyProfile, isStaffRole } from "@/lib/profile";

function NativeClientTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index"><Icon sf={{ default: "house", selected: "house.fill" }} /><Label>Inicio</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="catalog"><Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} /><Label>Catálogo</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites"><Icon sf={{ default: "heart", selected: "heart.fill" }} /><Label>Favoritos</Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile"><Icon sf={{ default: "person", selected: "person.fill" }} /><Label>Perfil</Label></NativeTabs.Trigger>
    </NativeTabs>
  );
}

function CartBadge({ count }: { count: number }) {
  const colors = useColors();
  if (count === 0) return null;
  return <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text></View>;
}

function ClassicTabs({ role }: { role: AppRole }) {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { totalItems } = useCart();
  const hidden = { href: null } as const;
  const staff = isStaffRole(role);
  const admin = role === "admin";

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.mutedForeground,
      headerShown: false,
      tabBarStyle: { position: "absolute", backgroundColor: isIOS ? "transparent" : colors.background, borderTopWidth: 1, borderTopColor: colors.border, elevation: 0, height: isWeb ? 84 : 72 },
      tabBarBackground: () => isIOS ? <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} /> : isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : null,
      tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 10, marginBottom: isWeb ? 12 : 0 },
    }}>
      <Tabs.Screen name="index" options={staff ? hidden : { title: "Inicio", tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="catalog" options={staff ? hidden : { title: "Catálogo", tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="favorites" options={staff ? hidden : { title: "Favoritos", tabBarIcon: ({ color }) => <Feather name="heart" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={staff ? hidden : { title: "Perfil", tabBarIcon: ({ color }) => <View style={{ position: "relative" }}><Feather name="user" size={22} color={color} /><CartBadge count={totalItems} /></View> }} />

      <Tabs.Screen name="operations" options={!staff ? hidden : { title: "Inicio", tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="sales" options={!admin ? hidden : { title: "Ventas", tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={22} color={color} /> }} />
      <Tabs.Screen name="clients" options={!staff ? hidden : { title: "Clientes", tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="calendar" options={!staff ? hidden : { title: "Calendario", tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="tasks" options={!staff || admin ? hidden : { title: "Tareas", tabBarIcon: ({ color }) => <Feather name="check-square" size={22} color={color} /> }} />
      <Tabs.Screen name="more" options={!staff ? hidden : { title: "Más", tabBarIcon: ({ color }) => <Feather name="menu" size={22} color={color} /> }} />

      {["inventory", "reports", "notes", "team", "add-product", "add-vendor", "send-promo", "admin-maintenance", "customer/[id]"].map((name) => <Tabs.Screen key={name} name={name} options={hidden} />)}
    </Tabs>
  );
}

export default function TabLayout() {
  usePushOnLogin();
  const pathname = usePathname();
  const [role, setRole] = useState<AppRole>("cliente");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchMyProfile().then((profile) => setRole(profile?.role || "cliente")).finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (!checked || isStaffRole(role)) return;
    const protectedRoutes = ["/operations", "/sales", "/clients", "/calendar", "/more", "/inventory", "/reports", "/tasks", "/notes", "/team", "/add-product", "/add-vendor", "/send-promo", "/admin-maintenance", "/customer"];
    if (protectedRoutes.some((route) => pathname.startsWith(route))) router.replace("/(tabs)" as never);
  }, [checked, pathname, role]);

  useEffect(() => {
    if (!checked || role === "admin") return;
    const adminOnly = ["/sales", "/reports", "/team", "/add-product", "/add-vendor", "/send-promo"];
    if (adminOnly.some((route) => pathname.startsWith(route))) router.replace("/operations" as never);
  }, [checked, pathname, role]);

  if (!checked) return <View style={{ flex: 1 }} />;
  if (!isStaffRole(role) && isLiquidGlassAvailable()) return <NativeClientTabs />;
  return <ClassicTabs role={role} />;
}

const styles = StyleSheet.create({
  badge: { position: "absolute", top: -4, right: -8, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#000", fontSize: 9, fontFamily: "Inter_700Bold" },
});
