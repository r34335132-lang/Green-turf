import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { sendPromotionToClients } from "@/lib/clientNotifications";

export default function SendPromoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Completa título y mensaje de la promoción.");
      return;
    }
    Alert.alert("Enviar promoción", "Se notificará a todos los clientes registrados.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Enviar",
        onPress: async () => {
          setLoading(true);
          try {
            const count = await sendPromotionToClients(title, body);
            Alert.alert("Enviado", `Promoción enviada a ${count} cliente(s).`, [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (e: any) {
            const isRls = e.message?.includes("row-level security");
            Alert.alert(
              "Error",
              isRls
                ? `${e.message}\n\nEjecuta supabase/promo-maintenance.sql`
                : e.message
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 80 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={[styles.heroIcon, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="gift" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Enviar promoción</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Los clientes verán una notificación en la app (campana en perfil).
        </Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Título *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. 15% en pasto deportivo"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Mensaje *</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="Detalle de la promoción, vigencia, condiciones..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />

        <Pressable
          onPress={handleSend}
          disabled={loading}
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Enviar a clientes</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  back: { marginBottom: 16 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 6, marginBottom: 24, lineHeight: 20 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_500Medium", marginBottom: 16 },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  btn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});
