import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// <-- ARREGLADO: CON LLAVES -->
import { ProductCard } from "@/components/catalog/ProductCard"; 
import { Category, Product, getCategories, getProducts } from "@/data/products";
import { useColors } from "@/hooks/useColors";

export default function CatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    (params.category as string) || null
  );
  const [sortBy, setSortBy] = useState<"price" | "rating" | "name">("rating");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const [fetchedProducts, fetchedCategories] = await Promise.all([
            getProducts(),
            getCategories(),
          ]);
          if (active) {
            setProducts(fetchedProducts || []);
            setCategories(fetchedCategories || []);
          }
        } catch (error) {
          console.error("Error cargando el catálogo:", error);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const safeProducts = products || [];
  const filtered = safeProducts
    .filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || p.category === selectedCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "price") return a.pricePerM2 - b.pricePerM2;
      if (sortBy === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Catálogo</Text>
        <View style={styles.sortRow}>
          {(["rating", "price", "name"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSortBy(s)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: sortBy === s ? colors.primary : colors.card,
                  borderColor: sortBy === s ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sortText,
                  { color: sortBy === s ? "#000" : colors.mutedForeground },
                ]}
              >
                {s === "rating" ? "Popular" : s === "price" ? "Precio" : "A–Z"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pasto..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <View>
        <FlatList
          data={[{ id: "all", name: "Todos", icon: "grid" }, ...categories]}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => {
            const isActive = (item.id === "all" && !selectedCategory) || selectedCategory === item.name;
            return (
              <Pressable
                onPress={() => setSelectedCategory(item.id === "all" ? null : item.name)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={(item.icon as any) || "grid"}
                  size={13}
                  color={isActive ? "#000" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.catText,
                    { color: isActive ? "#000" : colors.foreground },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={1}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {filtered.length} productos encontrados
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Sin resultados
            </Text>
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, gap: 14, paddingTop: 10 },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1 },
  sortRow: { flexDirection: "row", gap: 8 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, borderWidth: 1 },
  sortText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  searchContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginVertical: 14, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  catList: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  catText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  list: { paddingHorizontal: 20, gap: 16 },
  count: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8 },
  empty: { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 16 },
});