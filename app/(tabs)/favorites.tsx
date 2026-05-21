import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/catalog/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Favoritos</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {favorites.length} {favorites.length === 1 ? "producto" : "productos"}
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: "rgba(109,190,0,0.1)" }]}>
              <Feather name="heart" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Sin favoritos aún
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Guardá los productos que más te gusten para verlos después
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
  },
  count: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    gap: 16,
  },
  empty: {
    alignItems: "center",
    gap: 14,
    paddingTop: 80,
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
    fontSize: 20,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
