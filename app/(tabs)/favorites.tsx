import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/catalog/ProductCard";
import { Product, getProducts } from "@/data/products";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favoriteIds, isLoaded } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const data = await getProducts();
          if (active) setProducts(data || []);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const favoriteProducts = useMemo(
    () => products.filter((p) => favoriteIds.includes(p.id)),
    [products, favoriteIds]
  );

  if (!isLoaded || loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="heart" size={40} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin favoritos aún</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Toca el corazón en cualquier pasto para guardarlo aquí.
        </Text>
        <Pressable
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/catalog")}
        >
          <Text style={styles.emptyBtnText}>Explorar catálogo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mis Favoritos</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {favoriteProducts.length} {favoriteProducts.length === 1 ? "pasto guardado" : "pastos guardados"}
        </Text>
      </View>
      <FlatList
        data={favoriteProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item }) => <ProductCard product={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
  },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});
