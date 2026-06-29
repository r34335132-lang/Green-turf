import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { APP_LIMITS } from "@/constants/limits";
import { supabase } from "@/lib/supabase";
import { Category } from "@/data/products";
import { useColors } from "@/hooks/useColors";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const LOG_PREFIX = "[AddProduct]";

function logSupabaseError(step: string, error: unknown) {
  const err = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
    statusCode?: string | number;
  };
  console.error(`${LOG_PREFIX} ${step} — falló:`, {
    message: err?.message ?? String(error),
    code: err?.code,
    details: err?.details,
    hint: err?.hint,
    statusCode: err?.statusCode,
    raw: error,
  });
}

export default function AddProductScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Estados del producto
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [height, setHeight] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [tags, setTags] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Estados de Categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Nuevos estados para crear categoría en vivo
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    console.log(`${LOG_PREFIX} Cargando categorías...`);
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      console.log(`${LOG_PREFIX} Categorías cargadas:`, data?.length ?? 0);
      setCategories(data || []);
      if (data && data.length > 0 && !categoryId) {
        setCategoryId(data[0].id);
      }
    } catch (error: any) {
      logSupabaseError("fetchCategories", error);
    } finally {
      setLoadingCategories(false);
    }
  }

  // --- FUNCIÓN PARA CREAR CATEGORÍA ---
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Aviso", "Escribe un nombre para la categoría.");
      return;
    }
    setCreatingCat(true);
    const catPayload = { name: newCategoryName.trim(), icon: "grid" };
    console.log(`${LOG_PREFIX} Creando categoría:`, catPayload);
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([catPayload])
        .select()
        .single();

      if (error) throw error;
      console.log(`${LOG_PREFIX} Categoría creada:`, data?.id);

      // Agregamos la nueva categoría a la lista y la seleccionamos automáticamente
      setCategories((prev) => [...prev, data]);
      setCategoryId(data.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
    } catch (error: any) {
      logSupabaseError("handleCreateCategory", error);
      Alert.alert("Error al crear categoría", error.message);
    } finally {
      setCreatingCat(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToStorage = async (uri: string): Promise<string> => {
    console.log(`${LOG_PREFIX} Subiendo imagen al bucket "productos"...`);
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    console.log(`${LOG_PREFIX} Storage path:`, filePath, `| tamaño: ${arrayBuffer.byteLength} bytes`);

    if (arrayBuffer.byteLength > APP_LIMITS.maxImageUploadBytes) {
      throw new Error(
        `La imagen es muy pesada (máx. ${Math.round(APP_LIMITS.maxImageUploadBytes / 1024 / 1024)} MB en plan gratuito). Elige otra más liviana.`
      );
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("productos")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: false
      });

    if (uploadError) {
      logSupabaseError("storage.upload (bucket: productos)", uploadError);
      const isStorageRls =
        uploadError.message?.includes("row-level security") ||
        (uploadError as { statusCode?: string }).statusCode === "403";
      if (isStorageRls) {
        throw new Error(
          "Storage: el bucket \"productos\" bloquea la subida (RLS). En Supabase → Storage → productos → Policies, agrega INSERT para usuarios autenticados. Ver supabase/storage-policies-productos.sql"
        );
      }
      throw uploadError;
    }

    console.log(`${LOG_PREFIX} Imagen subida OK:`, uploadData?.path);
    const { data } = supabase.storage.from("productos").getPublicUrl(filePath);
    console.log(`${LOG_PREFIX} URL pública:`, data.publicUrl);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!name || !categoryId || !height || !price || !imageUri) {
      Alert.alert("Campos incompletos", "Verifica que Nombre, Categoría, Altura, Precio y Foto estén completos.");
      return;
    }

    if (name.length > APP_LIMITS.maxProductNameLength) {
      Alert.alert("Nombre muy largo", `Máximo ${APP_LIMITS.maxProductNameLength} caracteres.`);
      return;
    }
    if (description.length > APP_LIMITS.maxDescriptionLength) {
      Alert.alert("Descripción muy larga", `Máximo ${APP_LIMITS.maxDescriptionLength} caracteres.`);
      return;
    }

    setSubmitting(true);
    try {
      const { count, error: countError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      if (countError) throw countError;
      if ((count ?? 0) >= APP_LIMITS.maxProductsInCatalog) {
        throw new Error(
          `Límite del catálogo alcanzado (${APP_LIMITS.maxProductsInCatalog} productos). Elimina uno antes de agregar otro.`
        );
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      console.log(`${LOG_PREFIX} Sesión activa:`, !!session, "| user id:", user?.id ?? "(ninguno)");

      console.log(`${LOG_PREFIX} Paso 1/2: subir imagen...`);
      const publicImageUrl = await uploadImageToStorage(imageUri);
      
      const featuresArray = features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
        .slice(0, APP_LIMITS.maxFeaturesCount)
        .map((f) => f.slice(0, APP_LIMITS.maxFeatureLength));
      const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0).slice(0, 5);

      const productPayload = {
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
      };

      console.log(`${LOG_PREFIX} Paso 2/2: insert en tabla "products":`, productPayload);

      const { data: inserted, error } = await supabase
        .from("products")
        .insert([productPayload])
        .select("id, name")
        .single();

      if (error) throw error;

      console.log(`${LOG_PREFIX} Producto creado OK:`, inserted);
      Alert.alert("Éxito", "Producto añadido al catálogo.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      logSupabaseError("handleSubmit", error);
      const detail = [error.message, error.code, error.hint].filter(Boolean).join(" — ");
      Alert.alert("Error en la carga", detail || "Error desconocido. Revisa la consola.");
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <KeyboardAwareScrollViewCompat showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]} bottomOffset={24} keyboardDismissMode="interactive">
        
        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Nombre del producto *</Text>
          <TextInput value={name} onChangeText={setName} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        </View>

        {/* Categoría Dinámica */}
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
              
              {/* Botón para crear nueva categoría */}
              {!isAddingCategory && (
                <Pressable
                  onPress={() => setIsAddingCategory(true)}
                  style={[styles.categoryChip, { backgroundColor: "transparent", borderColor: colors.border, borderStyle: "dashed" }]}
                >
                  <Feather name="plus" size={14} color={colors.foreground} />
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Nueva</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Formulario en línea para nueva categoría */}
          {isAddingCategory && (
            <View style={styles.newCatContainer}>
              <TextInput 
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Ej. Uso Rudo..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { flex: 1, height: 44, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
              <Pressable 
                onPress={handleCreateCategory}
                disabled={creatingCat}
                style={[styles.createCatBtn, { backgroundColor: colors.primary }]}
              >
                {creatingCat ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.createCatBtnText}>Crear</Text>}
              </Pressable>
              <Pressable onPress={() => setIsAddingCategory(false)} style={{ padding: 10 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Altura y Precio */}
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

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Descripción</Text>
          <TextInput 
            value={description} 
            onChangeText={setDescription} 
            multiline 
            style={[styles.input, { height: 80, paddingVertical: 12, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} 
          />
        </View>

        {/* Características */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Características (separadas por coma)</Text>
          <TextInput 
            value={features} 
            onChangeText={setFeatures} 
            placeholder="Ej: Resistente UV, Fácil drenaje" 
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} 
          />
        </View>

        {/* Switches */}
        <View style={styles.row}>
          <View style={[styles.switchGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.foreground, flex: 1 }]}>¿Es Nuevo?</Text>
            <Switch value={isNew} onValueChange={setIsNew} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.switchGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.foreground, flex: 1 }]}>Top Ventas</Text>
            <Switch value={isBestSeller} onValueChange={setIsBestSeller} trackColor={{ true: colors.primary }} />
          </View>
        </View>

        {/* Imagen */}
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

        {/* Botón Subir */}
        <Pressable onPress={handleSubmit} disabled={submitting} style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}>
          {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Publicar Producto</Text>}
        </Pressable>
        
      </KeyboardAwareScrollViewCompat>
      </KeyboardAvoidingView>
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
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  newCatContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  createCatBtn: { paddingHorizontal: 16, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  createCatBtnText: { fontFamily: "Inter_700Bold", color: "#000", fontSize: 13 },
  switchGroup: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  imagePickerBox: { height: 100, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  submitBtn: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 12 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});
