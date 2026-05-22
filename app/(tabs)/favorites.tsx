import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Product, getProducts } from "@/data/products";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import ProductCard from "@/components/catalog/ProductCard";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getProducts();
      setProducts(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="heart" size={64} color={colors.border} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Aún no tienes pastos favoritos.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mis Favoritos</Text>
      </View>
      <FlatList
        data={favoriteProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { padding: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  list: { padding: 20, gap: 16 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 16, marginTop: 16 },
});