import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useClientNotifications } from "@/context/ClientNotificationsContext";
import { useStaffNotifications } from "@/context/StaffNotificationsContext";
import { promptPushPermissionAgain } from "@/hooks/usePushOnLogin";
import { useColors } from "@/hooks/useColors";
import { fetchMyProfile, isStaffRole, roleLabel } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const BASE_MENU_ITEMS = [
  { icon: "shopping-bag", label: "Mis pedidos", sub: "Ver historial" },
  { icon: "grid", label: "Calculadora", sub: "Calculá tu área", route: "/calculator" },
  { icon: "calendar", label: "Agendar instalación", sub: "Coordinar con un especialista" },
  { icon: "message-circle", label: "Chat de asesoría", sub: "Consultá con expertos" },
  { icon: "help-circle", label: "Preguntas frecuentes", sub: "Resolvé tus dudas" },
  { icon: "info", label: "Sobre GREEN TURF", sub: "Conocé la marca" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { totalItems, totalPrice } = useCart();
  const { favoriteIds } = useFavorites();
  const { unreadCount, refreshUnread } = useStaffNotifications();
  const { unreadCount: clientUnread, refreshUnread: refreshClientUnread } = useClientNotifications();

  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("Cargando...");
  const [userRole, setUserRole] = useState("Cliente");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      if (user.is_anonymous) {
        setProfileName("Invitado");
        setUserRole("Temporal");
        setIsAdmin(false);
        return;
      }

      const profile = await fetchMyProfile();
      if (profile) {
        const displayName =
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          profile.email ||
          user.email ||
          "Usuario";
        setProfileName(displayName);
        setUserRole(roleLabel(profile.role));
        setIsAdmin(isStaffRole(profile.role));
        console.log("[Perfil] rol cargado:", profile.role);
      } else {
        setProfileName(user.email || "Usuario");
        setUserRole("Cliente");
        setIsAdmin(false);
      }
    }
    loadUser();
    refreshUnread();
    refreshClientUnread();
  }, [refreshUnread, refreshClientUnread]);

  const handleAuthAction = async () => {
    await supabase.auth.signOut();
    if (user && !user.is_anonymous) {
      router.replace("/(auth)/login");
    } else {
      router.push("/(auth)/login");
    }
  };

  const isGuest = !user || user.is_anonymous;

  const clientExtras = !isGuest
    ? [
        {
          icon: "bell",
          label: "Notificaciones",
          sub: clientUnread > 0 ? `${clientUnread} sin leer` : "Promociones y mantenimiento",
          route: "/notifications",
          badge: clientUnread,
        },
        ...(!isAdmin
          ? [
              {
                icon: "tool",
                label: "Solicitar mantenimiento",
                sub: "Reporta un problema con tu pasto",
                route: "/maintenance-request",
              },
            ]
          : []),
        {
          icon: "smartphone",
          label: "Activar alertas push",
          sub: "Permisos de notificación del sistema",
          onPress: () => promptPushPermissionAgain(),
        },
      ]
    : [];

  const menuItems = isAdmin
    ? [
        {
          icon: "shield",
          label: "Panel de Administración",
          sub: unreadCount > 0 ? `${unreadCount} cotización(es) nueva(s)` : "Catálogo, CRM y asignaciones",
          route: "/admin/page",
          badge: unreadCount,
        },
        ...BASE_MENU_ITEMS,
      ]
    : [...clientExtras, ...BASE_MENU_ITEMS];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Perfil</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name={isAdmin ? "star" : "user"} size={28} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {profileName}
              </Text>
              {!isGuest && (
                <View style={[styles.roleBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                  <Text style={[styles.roleText, { color: colors.primary }]}>{userRole}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {isGuest ? "Iniciá sesión para cotizar" : user?.email || "Sin correo en sesión"}
            </Text>
            {!isGuest && user?.id ? (
              <Text style={[styles.userId, { color: colors.mutedForeground }]} numberOfLines={1}>
                ID: {user.id}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={handleAuthAction}
            style={[
              styles.loginBtn, 
              { backgroundColor: isGuest ? colors.primary : "transparent", borderWidth: isGuest ? 0 : 1, borderColor: colors.border }
            ]}
          >
            <Text style={[styles.loginBtnText, { color: isGuest ? "#000" : colors.foreground }]}>
              {isGuest ? "Entrar" : "Salir"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          {[
            { icon: "shopping-bag", value: totalItems.toString(), label: "En carrito" },
            { icon: "heart", value: favoriteIds.length.toString(), label: "Favoritos" },
            { icon: "package", value: "0", label: "Pedidos" },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon as any} size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {totalItems > 0 && (
          <Pressable onPress={() => router.push("/cart")} style={[styles.cartBanner, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
            <View style={[styles.cartIcon, { backgroundColor: "rgba(109,190,0,0.15)" }]}>
              <Feather name="shopping-cart" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cartBannerTitle, { color: colors.foreground }]}>Cotización activa</Text>
              <Text style={[styles.cartBannerSub, { color: colors.mutedForeground }]}>
                {totalItems} productos · ${totalPrice.toFixed(0)} estimado
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPCIONES</Text>
          <View style={[styles.menuList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {menuItems.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if ("onPress" in item && typeof (item as { onPress?: () => void }).onPress === "function") {
                    (item as { onPress: () => void }).onPress();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
                style={[
                  styles.menuItem,
                  i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: "rgba(109,190,0,0.1)" }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                {"badge" in item && (item as { badge?: number }).badge ? (
                  <View style={[styles.notifBadge, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.notifBadgeText}>{(item as { badge: number }).badge}</Text>
                  </View>
                ) : null}
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.brandFooter}>
          <Text style={[styles.brandText, { color: colors.primary }]}>GREEN TURF</Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Pasto Sintético Premium · v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 20, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 10 },
  name: { fontFamily: "Inter_700Bold", fontSize: 17, flexShrink: 1 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  roleText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase" },
  email: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  userId: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4, opacity: 0.85 },
  loginBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100 },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 6, padding: 16, borderRadius: 16, borderWidth: 1 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  cartBanner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  cartIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cartBannerTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  cartBannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  section: { gap: 10 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 },
  menuList: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  menuSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  notifBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginRight: 4,
  },
  notifBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11 },
  brandFooter: { alignItems: "center", gap: 4, paddingTop: 8 },
  brandText: { fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: 3 },
  brandSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
});