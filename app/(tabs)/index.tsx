import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Product, getProducts, HERO_SLIDES } from "@/data/products";
import { useColors } from "@/hooks/useColors";
import HeroBanner from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import ProductCard from "@/components/catalog/ProductCard";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  // Nuevos estados para manejar los datos asíncronos
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error cargando el inicio:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Ahora filtramos sobre el estado 'products' que viene de Supabase
  const bestSellers = products.filter((p) => p.isBestSeller);
  const newArrivals = products.filter((p) => p.isNew);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>
          Cargando catálogo...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        <HeroBanner slides={HERO_SLIDES} />
        <CategorySection />

        {/* Sección Más Vendidos */}
        {bestSellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Más Vendidos</Text>
            </View>
            <FlatList
              data={bestSellers}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item} horizontal />}
            />
          </View>
        )}

        {/* Sección Novedades */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Novedades</Text>
            </View>
            <FlatList
              data={newArrivals}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item} horizontal />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: { marginTop: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  productList: { paddingHorizontal: 20, gap: 16 },
});