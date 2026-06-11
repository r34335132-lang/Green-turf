import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorFallback } from "@/components/ErrorFallback";
import { Product, getProducts } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import ProductCard from "@/components/catalog/ProductCard";

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const allProducts = await getProducts();
        const found = allProducts.find((p) => p.id === id);
        
        if (found) {
          setProduct(found);
          setRelatedProducts(allProducts.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 3));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) return <ErrorFallback error={new Error("Producto no encontrado")} resetError={() => router.back()} />;

  const isFav = isFavorite(product.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
          <View style={[styles.headerControls, { top: insets.top || 20 }]}>
            <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.background + "E6" }]}>
              <Feather name="arrow-left" size={24} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => toggleFavorite(product)} style={[styles.iconBtn, { backgroundColor: colors.background + "E6" }]}>
              <Feather name="heart" size={24} color={isFav ? "#EF4444" : colors.foreground} fill={isFav ? "#EF4444" : "transparent"} />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.foreground }]}>{product.category}</Text>
                </View>
                {product.isNew && (
                  <View style={[styles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>Nuevo</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>{product.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.price, { color: colors.primary }]}>${product.pricePerM2}</Text>
              <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>por m²</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>

          <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.spec}>
              <Feather name="maximize-2" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Altura</Text>
                <Text style={[styles.specValue, { color: colors.foreground }]}>{product.height} mm</Text>
              </View>
            </View>
            <View style={[styles.specDivider, { backgroundColor: colors.border }]} />
            <View style={styles.spec}>
              <Feather name="star" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Rating</Text>
                <Text style={[styles.specValue, { color: colors.foreground }]}>{product.rating} / 5</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Características Principales</Text>
          <View style={styles.featuresList}>
            {product.features?.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Feather name="check-circle" size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {relatedProducts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 32 }]}>Productos Similares</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
                {relatedProducts.map((p) => (
                  <View key={p.id} style={{ width: 260 }}>
                    <ProductCard product={p} />
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom || 20 }]}>
        <Pressable style={[styles.calcBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/calculator")}>
          <Feather name="grid" size={24} color={colors.foreground} />
          <Text style={[styles.calcBtnText, { color: colors.foreground }]}>Calculadora</Text>
        </Pressable>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            addToCart(product, 10);
            router.push("/cart");
          }}
        >
          <Text style={styles.addBtnText}>Añadir al carrito</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { width: "100%", height: 350, position: "relative" },
  image: { width: "100%", height: "100%" },
  headerControls: { position: "absolute", left: 20, right: 20, flexDirection: "row", justifyContent: "space-between" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  tagsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  tagText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5 },
  price: { fontFamily: "Inter_700Bold", fontSize: 28 },
  priceUnit: { fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "right", marginTop: -4 },
  description: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 24, marginBottom: 24 },
  specsCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  spec: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  specDivider: { width: 1, height: "100%", marginHorizontal: 16 },
  specLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 2 },
  specValue: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 },
  featuresList: { gap: 12 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  relatedScroll: { gap: 16 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", padding: 20, paddingTop: 16, borderTopWidth: 1, gap: 12 },
  calcBtn: { width: 80, height: 56, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  calcBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  addBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});
