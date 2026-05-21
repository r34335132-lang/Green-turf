import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();

  const handleCheckout = () => {
    Alert.alert(
      "Checkout",
      "Funcionalidad de pago próximamente. ¿Querés recibir una cotización?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Solicitar cotización", onPress: clearCart },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Carrito
        </Text>
        {items.length > 0 && (
          <Pressable onPress={clearCart}>
            <Text style={[styles.clearBtn, { color: colors.destructive }]}>
              Vaciar
            </Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: "rgba(109,190,0,0.1)" }]}>
            <Feather name="shopping-bag" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Carrito vacío
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Explorá el catálogo y agregá productos
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/catalog")}
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.shopBtnText}>Ver catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + 160 },
            ]}
          >
            {items.map((item) => (
              <View
                key={item.product.id}
                style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Image
                  source={item.product.image}
                  style={styles.itemImg}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.itemCat, { color: colors.primary }]}>
                    {item.product.category} · {item.area}m²
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                    ${(item.product.pricePerM2 * item.area * item.quantity).toLocaleString("es-AR")}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    onPress={() => removeFromCart(item.product.id)}
                    style={styles.deleteBtn}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                  <View style={styles.qtyRow}>
                    <Pressable
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      style={[styles.qtyBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    >
                      <Feather name="minus" size={14} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.qtyValue, { color: colors.foreground }]}>
                      {item.quantity}
                    </Text>
                    <Pressable
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
                    >
                      <Feather name="plus" size={14} color="#000" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                Resumen
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Productos ({totalItems})
                </Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  ${totalPrice.toLocaleString("es-AR")}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Instalación
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  A cotizar
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>
                  Total estimado
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  ${totalPrice.toLocaleString("es-AR")}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom CTA */}
          <View
            style={[
              styles.bottomBar,
              {
                paddingBottom: insets.bottom + 20,
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={handleCheckout}
              style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="credit-card" size={18} color="#000" />
              <Text style={styles.checkoutText}>
                Solicitar cotización · ${totalPrice.toLocaleString("es-AR")}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
    flex: 1,
  },
  clearBtn: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  shopBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  shopBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  item: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    alignItems: "center",
  },
  itemImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  itemCat: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  itemPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  itemActions: {
    alignItems: "flex-end",
    gap: 10,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  qtyValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    minWidth: 20,
    textAlign: "center",
  },
  summary: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  summaryTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  summaryValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  totalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  checkoutText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
});
