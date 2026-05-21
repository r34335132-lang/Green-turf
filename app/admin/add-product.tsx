import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "@/lib/supabase";
import { Category } from "@/data/products";
import { useColors } from "@/hooks/useColors";

export default function AddProductScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [height, setHeight] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [features, setFeatures] = useState("");
  const [tags, setTags] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase.from("categories").select("*").order("name");
        if (error) throw error;
        setCategories(data || []);
        if (data && data.length > 0) setCategoryId(data[0].id);
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToStorage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("productos")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("productos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!name || !categoryId || !height || !price || !imageUri) {
      Alert.alert("Campos incompletos", "Por favor selecciona una imagen y llena los datos obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const publicImageUrl = await uploadImageToStorage(imageUri);
      const featuresArray = features.split(",").map(f => f.trim()).filter(f => f.length > 0);
      const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);

      const { error } = await supabase.from("products").insert([{
        name,
        category_id: categoryId,
        height: parseInt(height, 10),
        price_per_m2: parseFloat(price),
        description,
        image_url: publicImageUrl,
        features: featuresArray,
        tags: tagsArray,
        is_new: isNew,
        is_best_seller: isBestSeller,
        rating: 5.0,
      }]);

      if (error) throw error;
      Alert.alert("Éxito", "Producto añadido al catálogo.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert("Error en la carga", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Nuevo Pasto</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Nombre del producto *</Text>
          <TextInput value={name} onChangeText={setName} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Categoría *</Text>
          {loadingCategories ? <ActivityIndicator color={colors.primary} /> : (
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[styles.categoryChip, { backgroundColor: categoryId === cat.id ? colors.primary : colors.card, borderColor: categoryId === cat.id ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: categoryId === cat.id ? "#000" : colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>{cat.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Altura (mm) *</Text>
            <TextInput value={height} onChangeText={h => setHeight(h.replace(/[^0-9]/g, ""))} keyboardType="number-pad" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Precio por m² *</Text>
            <TextInput value={price} onChangeText={p => setPrice(p.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Foto del producto *</Text>
          <Pressable onPress={handlePickImage} style={[styles.imagePickerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {imageUri ? (
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>¡Imagen seleccionada!</Text>
            ) : (
              <>
                <Feather name="image" size={24} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 4 }}>Tocar para subir desde galería</Text>
              </>
            )}
          </Pressable>
        </View>

        <Pressable onPress={handleSubmit} disabled={submitting} style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}>
          {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Publicar Producto</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderWidth: 1 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, flex: 1, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: "Inter_500Medium" },
  row: { flexDirection: "row", gap: 12 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  imagePickerBox: { height: 100, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  submitBtn: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});