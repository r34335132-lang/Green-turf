import * as ImagePicker from "expo-image-picker";
// ... (dentro de tu componente AddProductScreen)

const [imageUri, setImageUri] = useState<string | null>(null);

// 1. Seleccionar la foto usando el selector nativo (sin requerir permisos invasivos de lectura total)
const handlePickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8, // Optimiza el tamaño del archivo para reducir costos de transferencia
  });

  if (!result.canceled && result.assets[0]) {
    setImageUri(result.assets[0].uri);
  }
};

// 2. Función interna para procesar el archivo y subirlo al bucket 'productos'
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

  // Obtener la URL pública del archivo dentro del bucket público
  const { data } = supabase.storage.from("productos").getPublicUrl(filePath);
  return data.publicUrl;
};

// 3. Modificación del handleSubmit original
const handleSubmit = async () => {
  if (!name || !categoryId || !height || !price || !imageUri) {
    Alert.alert("Campos incompletos", "Por favor selecciona una imagen y llena los datos obligatorios.");
    return;
  }

  setSubmitting(true);
  try {
    // Primero subimos la imagen al Storage
    const publicImageUrl = await uploadImageToStorage(imageUri);

    // Luego insertamos el registro completo en la base de datos relacional
    const featuresArray = features.split(",").map(f => f.trim()).filter(f => f.length > 0);
    const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);

    const { error } = await supabase.from("products").insert([
      {
        name,
        category_id: categoryId,
        height: parseInt(height, 10),
        price_per_m2: parseFloat(price),
        description,
        image_url: publicImageUrl, // Guardamos la URL pública generada
        features: featuresArray,
        tags: tagsArray,
        is_new: isNew,
        is_best_seller: isBestSeller,
        rating: 5.0,
      },
    ]);

    if (error) throw error;

    Alert.alert("Éxito", "Producto y multimedia cargados correctamente.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  } catch (error: any) {
    Alert.alert("Error en la carga", error.message);
  } finally {
    setSubmitting(false);
  }
};