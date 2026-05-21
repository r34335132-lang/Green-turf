import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { PRODUCTS, Product } from "@/data/products";

const { width } = Dimensions.get("window");

type Step = "pick" | "select" | "processing" | "result";

const GRASS_OPTIONS = PRODUCTS.slice(0, 5);

export default function VisualizerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("pick");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedGrass, setSelectedGrass] = useState<Product>(GRASS_OPTIONS[0]);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pickImage = async (fromCamera: boolean) => {
    let result;
    if (fromCamera && Platform.OS !== "web") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        aspect: [4, 3],
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        aspect: [4, 3],
      });
    }

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("select");
    }
  };

  const startVisualization = () => {
    setStep("processing");
    progressAnim.setValue(0);
    setProgress(0);

    // Animate pulsing orb
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 18 + 5;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        pulse.stop();
        setTimeout(() => setStep("result"), 400);
      }
      setProgress(Math.min(prog, 100));
      Animated.timing(progressAnim, {
        toValue: Math.min(prog, 100) / 100,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, 300);
  };

  const reset = () => {
    setImageUri(null);
    setStep("pick");
    setProgress(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            IA Visualizadora
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Mirá tu espacio transformado
          </Text>
        </View>
        {step !== "pick" && (
          <Pressable onPress={reset} style={[styles.resetBtn, { borderColor: colors.border }]}>
            <Feather name="refresh-ccw" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* STEP: PICK */}
        {step === "pick" && (
          <View style={styles.pickContainer}>
            {/* Hero graphic */}
            <View style={[styles.previewPlaceholder, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
              <Animated.View
                style={[
                  styles.orb,
                  {
                    backgroundColor: "rgba(109,190,0,0.15)",
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Feather name="camera" size={48} color={colors.primary} />
              <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>
                Visualizá tu espacio
              </Text>
              <Text style={[styles.placeholderDesc, { color: colors.mutedForeground }]}>
                Tomá una foto o seleccioná una imagen de tu patio, jardín o cancha
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.pickActions}>
              {Platform.OS !== "web" && (
                <Pressable
                  onPress={() => pickImage(true)}
                  style={[styles.pickBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="camera" size={20} color="#000" />
                  <Text style={[styles.pickBtnText, { color: "#000" }]}>
                    Tomar foto
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => pickImage(false)}
                style={[
                  styles.pickBtn,
                  {
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="image" size={20} color={colors.foreground} />
                <Text style={[styles.pickBtnText, { color: colors.foreground }]}>
                  Subir imagen
                </Text>
              </Pressable>
            </View>

            {/* How it works */}
            <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.howTitle, { color: colors.foreground }]}>
                ¿Cómo funciona?
              </Text>
              {HOW_STEPS.map((s, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={[styles.stepNum, { backgroundColor: "rgba(109,190,0,0.15)" }]}>
                    <Text style={[styles.stepNumText, { color: colors.primary }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.howText, { color: colors.mutedForeground }]}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* STEP: SELECT GRASS */}
        {step === "select" && imageUri && (
          <View style={styles.selectContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={[styles.imageBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.imageBadgeText}>ORIGINAL</Text>
              </View>
            </View>

            <Text style={[styles.selectTitle, { color: colors.foreground }]}>
              Elegí el tipo de pasto
            </Text>
            <View style={styles.grassGrid}>
              {GRASS_OPTIONS.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => setSelectedGrass(g)}
                  style={[
                    styles.grassOption,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        selectedGrass.id === g.id ? colors.primary : colors.border,
                      borderWidth: selectedGrass.id === g.id ? 2 : 1,
                    },
                  ]}
                >
                  <Image source={g.image} style={styles.grassThumb} resizeMode="cover" />
                  <View style={styles.grassInfo}>
                    <Text style={[styles.grassName, { color: colors.foreground }]}>
                      {g.name}
                    </Text>
                    <Text style={[styles.grassHeight, { color: colors.primary }]}>
                      {g.height}mm
                    </Text>
                  </View>
                  {selectedGrass.id === g.id && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={12} color="#000" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={startVisualization}
              style={[styles.visualizeBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="zap" size={18} color="#000" />
              <Text style={styles.visualizeBtnText}>
                Visualizar con {selectedGrass.name}
              </Text>
            </Pressable>
          </View>
        )}

        {/* STEP: PROCESSING */}
        {step === "processing" && (
          <View style={styles.processingContainer}>
            <Animated.View
              style={[
                styles.processingOrb,
                {
                  backgroundColor: "rgba(109,190,0,0.12)",
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View style={[styles.orbInner, { backgroundColor: "rgba(109,190,0,0.2)" }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.processingTitle, { color: colors.foreground }]}>
              Procesando imagen...
            </Text>
            <Text style={[styles.processingDesc, { color: colors.mutedForeground }]}>
              La IA está detectando el área y aplicando {selectedGrass.name}
            </Text>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.card }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {Math.round(progress)}%
            </Text>

            {PROCESSING_STEPS.map((s, i) => (
              <View key={i} style={styles.processingStep}>
                <Feather
                  name={progress > (i + 1) * 25 ? "check-circle" : "circle"}
                  size={14}
                  color={progress > (i + 1) * 25 ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.processingStepText,
                    {
                      color:
                        progress > (i + 1) * 25
                          ? colors.foreground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* STEP: RESULT */}
        {step === "result" && imageUri && (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>
              Resultado: {selectedGrass.name}
            </Text>

            {/* Before / After */}
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.beforeAfterImg}
                  resizeMode="cover"
                />
                <View style={[styles.beforeAfterLabel, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
                  <Text style={styles.beforeAfterText}>ANTES</Text>
                </View>
              </View>
              <View style={styles.beforeAfterItem}>
                <Image
                  source={selectedGrass.image}
                  style={styles.beforeAfterImg}
                  resizeMode="cover"
                />
                <View style={[styles.beforeAfterLabel, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.beforeAfterText, { color: "#000" }]}>
                    DESPUÉS
                  </Text>
                </View>
              </View>
            </View>

            {/* Product info */}
            <View style={[styles.resultProductCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image
                source={selectedGrass.image}
                style={styles.resultProductImg}
                resizeMode="cover"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.resultProductName, { color: colors.foreground }]}>
                  {selectedGrass.name}
                </Text>
                <Text style={[styles.resultProductCat, { color: colors.primary }]}>
                  {selectedGrass.category} · {selectedGrass.height}mm
                </Text>
                <Text style={[styles.resultProductPrice, { color: colors.foreground }]}>
                  ${selectedGrass.pricePerM2}/m²
                </Text>
              </View>
            </View>

            {/* Switch grass */}
            <Text style={[styles.switchTitle, { color: colors.mutedForeground }]}>
              Cambiar modelo
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {GRASS_OPTIONS.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => {
                    setSelectedGrass(g);
                    setStep("processing");
                    setProgress(0);
                    progressAnim.setValue(0);
                    let prog = 0;
                    const interval = setInterval(() => {
                      prog += Math.random() * 25 + 8;
                      if (prog >= 100) {
                        prog = 100;
                        clearInterval(interval);
                        setTimeout(() => setStep("result"), 300);
                      }
                      setProgress(Math.min(prog, 100));
                      Animated.timing(progressAnim, {
                        toValue: Math.min(prog, 100) / 100,
                        duration: 200,
                        useNativeDriver: false,
                      }).start();
                    }, 250);
                  }}
                  style={[
                    styles.switchChip,
                    {
                      backgroundColor: g.id === selectedGrass.id ? colors.primary : colors.card,
                      borderColor: g.id === selectedGrass.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.switchChipText,
                      { color: g.id === selectedGrass.id ? "#000" : colors.foreground },
                    ]}
                  >
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* CTA */}
            <Pressable
              style={[styles.visualizeBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={reset}
            >
              <Feather name="refresh-ccw" size={16} color="#000" />
              <Text style={styles.visualizeBtnText}>Nueva visualización</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const HOW_STEPS = [
  "Tomá o subí una foto de tu espacio",
  "Seleccioná el tipo de pasto que querés visualizar",
  "La IA detecta el área y genera el preview",
  "Comparás el antes y después en tiempo real",
];

const PROCESSING_STEPS = [
  "Analizando imagen",
  "Detectando área verde",
  "Aplicando textura de pasto",
  "Generando preview realista",
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 2,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 20,
  },
  pickContainer: { gap: 20 },
  previewPlaceholder: {
    height: 280,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
    position: "relative",
  },
  orb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  placeholderTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
  },
  placeholderDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  pickActions: { flexDirection: "row", gap: 12 },
  pickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  pickBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  howCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  howTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  howStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  howText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  selectContainer: { gap: 20 },
  imageContainer: { borderRadius: 20, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: 220, borderRadius: 20 },
  imageBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#000",
    letterSpacing: 1,
  },
  selectTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
  },
  grassGrid: { gap: 10 },
  grassOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 16,
    position: "relative",
  },
  grassThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  grassInfo: { flex: 1, gap: 2 },
  grassName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  grassHeight: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  visualizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  visualizeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  processingContainer: {
    alignItems: "center",
    paddingTop: 32,
    gap: 16,
    position: "relative",
  },
  processingOrb: {
    position: "absolute",
    top: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  orbInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  processingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  processingDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  progressTrack: {
    width: width - 80,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  processingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingLeft: (width - 40) / 2 - 90,
  },
  processingStepText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  resultContainer: { gap: 16 },
  resultTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  beforeAfterRow: {
    flexDirection: "row",
    gap: 10,
  },
  beforeAfterItem: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  beforeAfterImg: {
    width: "100%",
    height: 200,
  },
  beforeAfterLabel: {
    position: "absolute",
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  beforeAfterText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 1,
  },
  resultProductCard: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  resultProductImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  resultProductName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  resultProductCat: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  resultProductPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  switchTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  switchChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  switchChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
