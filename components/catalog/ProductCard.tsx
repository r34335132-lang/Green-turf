import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { Product } from "@/data/products";
import { useColors } from "@/hooks/useColors";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

const { width } = Dimensions.get("window");

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();
  const scale = useRef(new Animated.Value(1)).current;
  const fav = isFavorite(product.id);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const cardWidth = compact ? (width - 52) / 2 : width - 40;
  const imgHeight = compact ? 160 : 260;

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={() => router.push(`/product/${product.id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={{ height: imgHeight, borderRadius: 12, overflow: "hidden" }}>
          <Image
            source={
              typeof product.image === "string" && product.image.startsWith("http")
                ? { uri: product.image }
                : product.image
            }
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.badges}>
            {product.isNew && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>NUEVO</Text>
              </View>
            )}
            {product.isBestSeller && (
              <View style={[styles.badge, { backgroundColor: "#FFD700" }]}>
                <Text style={[styles.badgeText, { color: "#000" }]}>
                  TOP
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.favButton}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleFavorite(product);
            }}
          >
            <Feather
              name={fav ? "heart" : "heart"}
              size={18}
              color={fav ? colors.primary : "#fff"}
            />
          </Pressable>
        </View>

        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text
              style={[styles.category, { color: colors.primary }]}
              numberOfLines={1}
            >
              {product.category.toUpperCase()}
            </Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.mutedForeground }]}>
                {product.rating}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>

          {!compact && (
            <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {product.description}
            </Text>
          )}

          <View style={styles.bottomRow}>
            <View>
              <Text style={[styles.height, { color: colors.mutedForeground }]}>
                {product.height}mm · {product.category}
              </Text>
              <Text style={[styles.price, { color: colors.foreground }]}>
                ${product.pricePerM2}
                <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>
                  {" "}
                  /m²
                </Text>
              </Text>
            </View>
            <Pressable
              style={[styles.arrowBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <Feather name="arrow-right" size={16} color="#000" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badges: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#000",
    letterSpacing: 0.5,
  },
  favButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 16,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  height: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 2,
  },
  price: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProductCard;
