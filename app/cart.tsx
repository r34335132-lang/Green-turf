// app/cart.tsx
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

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, removeFromCart, totalAmount, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función principal que envía la cotización a la base de datos
  const handleRequestQuote = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      // 1. Obtener el usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Debes iniciar sesión para cotizar.");

      // 2. Obtener el perfil del usuario (para saber su nombre)
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", user.id)
        .single();

      const fullName = profile 
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() 
        : "Cliente App";

      // 3. Crear los registros para el CRM de Ventas (Uno por cada tipo de pasto en el carrito)
      const quoteRequests = items.map((item) => ({
        client_name: fullName,
        phone: profile?.phone || "Sin teléfono registrado",
        email: user.email,
        grass_type_id: item.product.id,
        m2_requested: item.area, // Los metros cuadrados que calculó
        status: "pendiente",
        notes: `Cotización solicitada desde la App Móvil. Costo estimado por material: $${(item.product.pricePerM2 * item.area).toFixed(2)}`,
      }));

      // 4. Insertar en la tabla de seguimiento (CRM)
      const { error: insertError } = await supabase
        .from("leads_tracking")
        .insert(quoteRequests);

      if (insertError) throw insertError;

      // 5. Éxito: Limpiar carrito y avisar al cliente
      Alert.alert(
        "¡Cotización Solicitada!",
        "Hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo muy pronto para afinar detalles de instalación y entrega.",
        [
          { 
            text: "Entendido", 
            onPress: () => {
              clearCart();
              router.back();
            } 
          }
        ]
      );

    } catch (error: any) {
      Alert.alert("Error al enviar", error.message);
    } finally {
      setIsSubmitting(false);
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
                Estimado: ${(item.product.pricePerM2 * item.area).toFixed(2)}
              </Text>
            </View>
            <Pressable onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
              <Feather name="trash-2" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Footer Fijo con el Botón de Cotizar */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Costo estimado de material</Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>${totalAmount.toFixed(2)}</Text>
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