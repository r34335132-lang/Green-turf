import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { APP_LIMITS } from "@/constants/limits";
import { Product, getProducts } from "@/data/products";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import {
  generateGrassVisualization,
  getTodayVisualizationCount,
  uploadSpacePhoto,
  type VisualizeError,
} from "@/lib/visualizer/generate";
import { SCENE_OPTIONS, SceneType, buildVisualizationPrompt } from "@/lib/visualizer/grassPrompt";

export default function VisualizerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ productId?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scene, setScene] = useState<SceneType>("jardin");
  const [spaceUri, setSpaceUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedToday, setUsedToday] = useState(0);

  const loadProducts = useCallback(async () => {
    const list = await getProducts();
    setProducts(list);
    if (params.productId) {
      const pre = list.find((p) => p.id === params.productId);
      if (pre) setSelectedProduct(pre);
    }
  }, [params.productId]);

  useEffect(() => {
    loadProducts();
    getTodayVisualizationCount().then(setUsedToday);
  }, [loadProducts]);

  const remaining = Math.max(0, APP_LIMITS.maxVisualizationsPerDay - usedToday);

  const handleSelectSpace = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      setSpaceUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProduct) {
      Alert.alert("Elige un pasto", "Selecciona el producto del catálogo para que la IA sepa qué textura aplicar.");
      return;
    }
    if (!spaceUri) {
      Alert.alert("Falta la foto", "Sube una foto de tu jardín, terraza o área a cubrir.");
      return;
    }
    if (remaining <= 0) {
      Alert.alert(
        "Límite diario",
        `Máximo ${APP_LIMITS.maxVisualizationsPerDay} visualizaciones por día. Vuelve mañana o contacta ventas.`
      );
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Inicia sesión", "Necesitas una cuenta para usar el visualizador IA.");
        return;
      }

      const spaceUrl = await uploadSpacePhoto(spaceUri, user.id);
      const result = await generateGrassVisualization(selectedProduct, spaceUrl, scene);
      setResultUri(result.resultUrl);
      setUsedToday((n) => n + 1);
    } catch (e) {
      const err = e as VisualizeError;
      Alert.alert("No se pudo generar", err.message || "Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const previewPrompt = selectedProduct ? buildVisualizationPrompt(selectedProduct, scene) : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Visualizador IA</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Ve cómo quedaría el pasto en tu espacio
        </Text>
        <Text style={[styles.quota, { color: colors.mutedForeground }]}>
          {remaining} de {APP_LIMITS.maxVisualizationsPerDay} renders hoy
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1. Elige el pasto</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
          {products.map((p) => {
            const active = selectedProduct?.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelectedProduct(p);
                  setResultUri(null);
                }}
                style={[
                  styles.productChip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary + "15" : colors.card,
                  },
                ]}
              >
                <Image source={{ uri: p.image }} style={styles.productThumb} />
                <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>{p.height} mm</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>2. Tipo de espacio</Text>
        <View style={styles.sceneRow}>
          {SCENE_OPTIONS.map((opt) => {
            const active = scene === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setScene(opt.id);
                  setResultUri(null);
                }}
                style={[
                  styles.sceneChip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary + "15" : colors.card,
                  },
                ]}
              >
                <Feather name={opt.icon as keyof typeof Feather.glyphMap} size={18} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.sceneLabel, { color: colors.foreground }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>3. Foto de tu área</Text>
        <Pressable
          onPress={handleSelectSpace}
          style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {spaceUri ? (
            <Image source={{ uri: spaceUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <>
              <Feather name="camera" size={40} color={colors.primary} />
              <Text style={[styles.uploadText, { color: colors.foreground }]}>Seleccionar foto</Text>
              <Text style={[styles.uploadSubtext, { color: colors.mutedForeground }]}>
                Buena luz, que se vea el piso o jardín actual
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {selectedProduct && (
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>La IA usará:</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {selectedProduct.name} · {selectedProduct.height} mm · {selectedProduct.category}
          </Text>
          {previewPrompt && (
            <Text style={[styles.promptPreview, { color: colors.mutedForeground }]} numberOfLines={3}>
              {previewPrompt}
            </Text>
          )}
        </View>
      )}

      <Pressable
        onPress={handleGenerate}
        disabled={loading}
        style={[styles.generateBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Feather name="zap" size={20} color="#000" />
            <Text style={styles.generateText}>Generar visualización</Text>
          </>
        )}
      </Pressable>

      {resultUri && spaceUri && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resultado</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareCol}>
              <Text style={[styles.compareLabel, { color: colors.mutedForeground }]}>Antes</Text>
              <Image source={{ uri: spaceUri }} style={styles.compareImage} resizeMode="cover" />
            </View>
            <View style={styles.compareCol}>
              <Text style={[styles.compareLabel, { color: colors.mutedForeground }]}>Con pasto</Text>
              <Image source={{ uri: resultUri }} style={styles.compareImage} resizeMode="cover" />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 15, marginTop: 4 },
  quota: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 12 },
  productRow: { gap: 12, paddingRight: 8 },
  productChip: {
    width: 120,
    borderRadius: 16,
    borderWidth: 2,
    padding: 8,
    alignItems: "center",
  },
  productThumb: { width: 72, height: 72, borderRadius: 12 },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 8, textAlign: "center" },
  productMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  sceneRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sceneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  sceneLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 24,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 20,
    gap: 8,
  },
  previewImage: { width: "100%", height: 220, borderRadius: 16 },
  uploadText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  uploadSubtext: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  infoCard: { marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 1 },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  promptPreview: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 8, lineHeight: 16 },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    height: 56,
    borderRadius: 16,
  },
  generateText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  compareRow: { flexDirection: "row", gap: 12 },
  compareCol: { flex: 1 },
  compareLabel: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 6 },
  compareImage: { width: "100%", height: 160, borderRadius: 12 },
});
