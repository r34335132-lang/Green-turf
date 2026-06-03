import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAdminProducts } from "@/data/products";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts();
      setProducts(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Bodega y Stock</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Ajuste rápido de inventario
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          onRefresh={fetchProducts}
          refreshing={loading}
          renderItem={({ item }) => (
            <InventoryListItem item={item} onRefresh={fetchProducts} colors={colors} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="package" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin productos</Text>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

// Componente individual para cada fila de la lista
function InventoryListItem({ item, onRefresh, colors }: any) {
  const [stock, setStock] = useState(item.stock?.toString() || "0");
  const [saving, setSaving] = useState(false);

  const hasChanged = stock !== (item.stock?.toString() || "0");

  const handleUpdate = async () => {
    setSaving(true);
    // COMANDO UPDATE PARA MODIFICAR EL INVENTARIO EXISTENTE
    const { error } = await supabase
      .from("products")
      .update({ stock: Number(stock) })
      .eq("id", item.id);
      
    setSaving(false);

    if (error) {
      Alert.alert("Error", "No se pudo actualizar el stock");
    } else {
      onRefresh(); // Sincronizamos los datos al guardar
    }
  };

  return (
    <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="layers" size={20} color={colors.primary} />
      </View>
      
      <View style={styles.infoCol}>
        <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
          {item.categories?.name || "General"} · ${item.price_per_m2}/m²
        </Text>
      </View>

      <View style={styles.stockCol}>
        <Text style={[styles.stockLabel, { color: colors.mutedForeground }]}>Stock</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            selectTextOnFocus
          />
          {hasChanged && (
            <Pressable 
              onPress={handleUpdate} 
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Feather name="check" size={16} color="#000" />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginTop: 12,
  },
  
  // Estilos de la fila
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  itemMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  stockCol: {
    alignItems: "flex-end",
  },
  stockLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    marginBottom: 4,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    width: 60,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});