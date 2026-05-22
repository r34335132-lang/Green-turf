import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router"; // Agregado para poder navegar

import { Product, getProducts } from "@/data/products";
import { useColors } from "@/hooks/useColors";

// --- LAS TRES IMPORTACIONES CON LLAVES { } ---
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategorySection } from "@/components/home/CategorySection"; 
import { ProductCard } from "@/components/catalog/ProductCard";
// ---------------------------------------------

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        setProducts(data || []);
      } catch (error) {
        console.error("Error cargando el inicio:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const safeProducts = products || [];
  const bestSellers = safeProducts.filter((p) => p.isBestSeller);
  const newArrivals = safeProducts.filter((p) => p.isNew);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Banner principal */}
        <HeroBanner />
        
        {/* Sección de categorías con su función de navegación */}
        <CategorySection 
          onSelect={(catId) => {
            // Cuando tocan una categoría, los manda al catálogo con el filtro
            router.push({ pathname: "/(tabs)/catalog", params: { category: catId as string } });
          }} 
        />

        {/* Productos Más Vendidos */}
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
              renderItem={({ item }) => <ProductCard product={item} compact={true} />}
            />
          </View>
        )}

        {/* Productos Nuevos */}
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
              renderItem={({ item }) => <ProductCard product={item} compact={true} />}
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