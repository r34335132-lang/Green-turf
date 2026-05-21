import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { useColors } from "@/hooks/useColors";

export default function VisualizerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSelectSpace = async () => {
    // Al usar launchImageLibraryAsync sin requerir permisos extra en app.json, 
    // Android usa el selector seguro del sistema operativo automáticamente.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      // Aquí irá la lógica posterior de inpainting de IA
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Visualizador IA</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Proyecta el pasto en tu espacio</Text>
      </View>

      <View style={styles.content}>
        <Pressable 
          onPress={handleSelectSpace}
          style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="camera" size={40} color={colors.primary} />
          <Text style={[styles.uploadText, { color: colors.foreground }]}>
            Seleccionar foto del área
          </Text>
          <Text style={[styles.uploadSubtext, { color: colors.mutedForeground }]}>
            Usa una foto con buena iluminación del piso o jardín
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 15, marginTop: 4 },
  content: { flex: 1, padding: 20, justifyContent: "center" },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  uploadText: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 12 },
  uploadSubtext: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});