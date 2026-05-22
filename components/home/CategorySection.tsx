import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Category, getCategories } from "@/data/products";
import { useColors } from "@/hooks/useColors";

export default function CategorySection() {
  const colors = useColors();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(data => setCategories(data || []));
  }, []);

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Categorías</Text>
        <Pressable onPress={() => router.push("/(tabs)/catalog")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todo</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/(tabs)/catalog", params: { category: cat.name } })}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
              <Feather name={(cat.icon as any) || "grid"} size={24} color={colors.primary} />
            </View>
            <Text style={[styles.categoryName, { color: colors.foreground }]}>{cat.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  seeAll: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  categoryCard: { width: 100, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  categoryName: { fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "center" },
});