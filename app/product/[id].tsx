import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
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
import { useFavorites } from "@/context/FavoritesContext";
import { PRODUCTS } from "@/data/products";
import { useColors } from "@/hooks/useColors";

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [area, setArea] = useState(10);
  const [added, setAdded] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Producto no encontrado</Text>
      </View>
    );
  }

  const fav = isFavorite(product.id);
  const total = area * product.pricePerM2;

  const handleAddToCart = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 50 }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    addToCart(product, area);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageWrap}>
          <Image
            source={product.image}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />

          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { top: insets.top + 12, backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>

          {/* Fav */}
          <Pressable
            onPress={() => toggleFavorite(product)}
            style={[
              styles.favBtn,
              {
                top: insets.top + 12,
                backgroundColor: fav
                  ? "rgba(109,190,0,0.85)"
                  : "rgba(0,0,0,0.5)",
              },
            ]}
          >
            <Feather name="heart" size={20} color={fav ? "#000" : "#fff"} />
          </Pressable>

          {/* Badges overlay */}
          <View style={styles.imageBadges}>
            {product.isBestSeller && (
              <View style={[styles.badge, { backgroundColor: "#FFD700" }]}>
                <Text style={[styles.badgeText, { color: "#000" }]}>
                  MÁS VENDIDO
                </Text>
              </View>
            )}
            {product.isNew && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>NUEVO</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Category + Rating */}
          <View style={styles.topRow}>
            <Text style={[styles.category, { color: colors.primary }]}>
              {product.category.toUpperCase()}
            </Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>
                {product.rating}
              </Text>
              <Text style={[styles.reviews, { color: colors.mutedForeground }]}>
                ({product.reviews})
              </Text>
            </View>
          </View>

          <Text style={[styles.name, { color: colors.foreground }]}>
            {product.name}
          </Text>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {product.description}
          </Text>

          {/* Spec chips */}
          <View style={styles.specs}>
            <View style={[styles.spec, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={14} color={colors.primary} />
              <Text style={[styles.specText, { color: colors.foreground }]}>
                {product.height}mm
              </Text>
            </View>
            {product.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.spec, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.specText, { color: colors.mutedForeground }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          {/* Features */}
          <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.featuresTitle, { color: colors.foreground }]}>
              Características
            </Text>
            {product.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                  {f}
                </Text>
              </View>
            ))}
          </View>

          {/* Area Calculator */}
          <View style={[styles.calcCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
            <View style={styles.calcHeader}>
              <View style={[styles.calcIcon, { backgroundColor: "rgba(109,190,0,0.12)" }]}>
                <Feather name="maximize" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.calcTitle, { color: colors.foreground }]}>
                  Calculadora de área
                </Text>
                <Text style={[styles.calcSub, { color: colors.mutedForeground }]}>
                  Ajustá los m² para ver el costo
                </Text>
              </View>
            </View>

            <View style={styles.areaRow}>
              <Pressable
                onPress={() => setArea((a) => Math.max(1, a - 1))}
                style={[styles.areaBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <Feather name="minus" size={18} color={colors.foreground} />
              </Pressable>
              <View style={styles.areaCenter}>
                <Text style={[styles.areaValue, { color: colors.primary }]}>
                  {area} m²
                </Text>
                <Text style={[styles.areaTotal, { color: colors.foreground }]}>
                  ${total.toLocaleString("es-AR")}
                </Text>
              </View>
              <Pressable
                onPress={() => setArea((a) => a + 1)}
                style={[styles.areaBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={18} color="#000" />
              </Pressable>
            </View>
          </View>

          {/* Visualizer CTA */}
          <Pressable
            onPress={() => router.push("/(tabs)/visualizer")}
            style={[styles.vizCta, { borderColor: colors.glassBorder, backgroundColor: colors.card }]}
          >
            <Feather name="camera" size={18} color={colors.primary} />
            <Text style={[styles.vizCtaText, { color: colors.foreground }]}>
              Ver cómo se vería en tu espacio
            </Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>

          <View style={{ height: insets.bottom + 120 }} />
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
        <View>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
            Precio por m²
          </Text>
          <Text style={[styles.priceValue, { color: colors.foreground }]}>
            ${product.pricePerM2}
            <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>
              /m²
            </Text>
          </Text>
        </View>
        <Animated.View style={{ flex: 1, transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={handleAddToCart}
            style={[
              styles.addBtn,
              { backgroundColor: added ? "#3D9B00" : colors.primary },
            ]}
          >
            <Feather
              name={added ? "check" : "shopping-bag"}
              size={18}
              color="#000"
            />
            <Text style={styles.addBtnText}>
              {added ? "Agregado!" : "Agregar al carrito"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrap: { height: 420, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  favBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBadges: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#000",
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  reviews: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 36,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
  },
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  spec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  specText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  featuresCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  featuresTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  calcCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  calcHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  calcIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calcTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  calcSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  areaBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  areaCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  areaValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  areaTotal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  vizCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vizCtaText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  priceValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
});
