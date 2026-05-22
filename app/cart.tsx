// app/cart.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { User } from "@supabase/supabase-js";

import { GuestContactModal, GuestContact } from "@/components/cart/GuestContactModal";
import { APP_LIMITS, formatMoney, getProductPrice } from "@/constants/limits";
import { getCartLineTotal, useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { QuoteContact } from "@/lib/leads";
import { notifyStaffPush } from "@/lib/push";
import { supabase } from "@/lib/supabase";

const GUEST_CONTACT_KEY = "guest_quote_contact";

async function loadSavedGuestContact(): Promise<Partial<GuestContact>> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CONTACT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveGuestContact(contact: QuoteContact) {
  await AsyncStorage.setItem(GUEST_CONTACT_KEY, JSON.stringify(contact));
}

async function resolveContactForQuote(user: User): Promise<QuoteContact | null> {
  if (user.is_anonymous) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    : "";
  const phone = profile?.phone?.trim() || "";
  const email = user.email?.trim() || "";

  if (fullName.length >= 2 && phone.length >= 8 && email.includes("@")) {
    return { name: fullName, phone, email };
  }
  return null;
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [guestInitial, setGuestInitial] = useState<Partial<GuestContact>>({});

  const submitQuote = async (contact: QuoteContact) => {
    setIsSubmitting(true);
    try {
      const batch = items.slice(0, APP_LIMITS.maxQuotesPerSubmit);
      const quoteRequests = batch.map((item) => {
        const lineTotal = getCartLineTotal(item);
        return {
          client_name: contact.name,
          phone: contact.phone,
          email: contact.email,
          grass_type_id: item.product.id,
          m2_requested: item.area,
          status: "pendiente",
          notes: `Cotización App. Material estimado: $${formatMoney(lineTotal)} (${item.area} m² × $${formatMoney(getProductPrice(item.product))}/m²)`,
        };
      });

      const { error: insertError } = await supabase
        .from("leads_tracking")
        .insert(quoteRequests);

      if (insertError) {
        console.error("[Cart] leads_tracking insert:", insertError);
        throw insertError;
      }

      await notifyStaffPush(
        "Nueva cotización",
        `${contact.name} solicitó cotización (${batch.length} producto(s))`
      );

      await saveGuestContact(contact);
      setGuestModalVisible(false);

      Alert.alert(
        "¡Cotización solicitada!",
        "Recibimos tu solicitud. Un asesor te contactará pronto.",
        [
          {
            text: "Entendido",
            onPress: () => {
              clearCart();
              router.back();
            },
          },
        ]
      );
    } catch (error: unknown) {
      const err = error as { message?: string; hint?: string };
      const msg = err.message || "No se pudo enviar la cotización.";
      const isRls = msg.includes("row-level security");
      Alert.alert(
        "Error al enviar",
        isRls
          ? `${msg}\n\nEjecuta supabase/leads-tracking-policies.sql en el SQL Editor de Supabase.`
          : msg + (err.hint ? `\n\n${err.hint}` : "")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestQuote = async () => {
    if (items.length === 0) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        Alert.alert(
          "Inicia sesión",
          "Entra como invitado o con tu cuenta para solicitar una cotización.",
          [{ text: "Ir a login", onPress: () => router.push("/(auth)/login") }]
        );
        return;
      }

      const contact = await resolveContactForQuote(user);
      if (contact) {
        await submitQuote(contact);
        return;
      }

      const saved = await loadSavedGuestContact();
      setGuestInitial({
        name: saved.name || "",
        phone: saved.phone || "",
        email: saved.email || user.email || "",
      });
      setGuestModalVisible(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert("Error", err.message || "No se pudo continuar.");
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Tu Cotización</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContent}>
          <Feather name="shopping-cart" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Aún no has agregado pasto a tu cotización.
          </Text>
          <Pressable
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.continueBtnText}>Explorar Catálogo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <GuestContactModal
        visible={guestModalVisible}
        initial={guestInitial}
        loading={isSubmitting}
        onClose={() => !isSubmitting && setGuestModalVisible(false)}
        onSubmit={submitQuote}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Tu Cotización</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <View key={`${item.product.id}-${item.area}`} style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: item.product.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>{item.product.name}</Text>
              <Text style={[styles.itemArea, { color: colors.mutedForeground }]}>
                Área a cubrir: {item.area} m²
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                Estimado: ${formatMoney(getCartLineTotal(item))}
              </Text>
            </View>
            <Pressable onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
              <Feather name="trash-2" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Costo estimado de material</Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>${formatMoney(totalPrice)}</Text>
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          * El total mostrado es un estimado del material. La instalación y el envío se cotizarán por separado.
        </Text>

        <Pressable
          style={[styles.checkoutBtn, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleRequestQuote}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.checkoutBtnText}>Solicitar Cotización Oficial</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "transparent" },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -10 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, flex: 1, textAlign: "center" },
  scroll: { padding: 20, gap: 16 },
  cartItem: { flexDirection: "row", padding: 12, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  itemImage: { width: 80, height: 80, borderRadius: 10 },
  itemDetails: { flex: 1, marginLeft: 16 },
  itemName: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 4 },
  itemArea: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  itemPrice: { fontFamily: "Inter_700Bold", fontSize: 15 },
  removeBtn: { padding: 8 },
  footer: { padding: 24, borderTopWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  totalLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  totalAmount: { fontFamily: "Inter_700Bold", fontSize: 24 },
  disclaimer: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 20, lineHeight: 18 },
  checkoutBtn: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  checkoutBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  emptyContainer: { justifyContent: "space-between" },
  emptyContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 16, textAlign: "center", marginTop: 24, marginBottom: 32 },
  continueBtn: { paddingHorizontal: 32, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  continueBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#000" },
});
