import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
import { useColors } from "@/hooks/useColors";

const MENU_ITEMS = [
  { icon: "shopping-bag", label: "Mis pedidos", sub: "Ver historial" },
  { icon: "calculator", label: "Calculadora", sub: "Calculá tu área", route: "/calculator" },
  { icon: "calendar", label: "Agendar instalación", sub: "Coordinar con un especialista" },
  { icon: "message-circle", label: "Chat de asesoría", sub: "Consultá con expertos" },
  { icon: "help-circle", label: "Preguntas frecuentes", sub: "Resolvé tus dudas" },
  { icon: "info", label: "Sobre GREEN TURF", sub: "Conocé la marca" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { totalItems, totalPrice } = useCart();
  const { favorites } = useFavorites();

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

        {/* Avatar */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={28} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              Invitado
            </Text>
            <Text style={[styles.email, { color: colors.mutedForeground }]}>
              Iniciá sesión para más funciones
            </Text>
          </View>
          <Pressable
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: "shopping-bag", value: totalItems.toString(), label: "En carrito" },
            { icon: "heart", value: favorites.length.toString(), label: "Favoritos" },
            { icon: "package", value: "0", label: "Pedidos" },
          ].map((s, i) => (
            <View
              key={i}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={s.icon as any} size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Cart Summary */}
        {totalItems > 0 && (
          <Pressable
            onPress={() => router.push("/cart")}
            style={[styles.cartBanner, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
          >
            <View style={[styles.cartIcon, { backgroundColor: "rgba(109,190,0,0.15)" }]}>
              <Feather name="shopping-cart" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cartBannerTitle, { color: colors.foreground }]}>
                Carrito activo
              </Text>
              <Text style={[styles.cartBannerSub, { color: colors.mutedForeground }]}>
                {totalItems} productos · ${totalPrice.toFixed(0)} estimado
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            OPCIONES
          </Text>
          <View style={[styles.menuList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {MENU_ITEMS.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if (item.route) router.push(item.route as any);
                }}
                style={[
                  styles.menuItem,
                  i < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: "rgba(109,190,0,0.1)" }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>
                    {item.sub}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Brand */}
        <View style={styles.brandFooter}>
          <Text style={[styles.brandText, { color: colors.primary }]}>
            GREEN TURF
          </Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
            Pasto Sintético Premium · v1.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
  },
  loginBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#000",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  cartBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cartIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  cartBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  menuList: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  menuSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 1,
  },
  brandFooter: {
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
  },
  brandText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 3,
  },
  brandSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
