import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { createMaintenanceRequest, getMyMaintenanceRequests } from "@/lib/maintenance";
import { supabase } from "@/lib/supabase";

export default function MaintenanceRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", user?.id || "")
        .maybeSingle();
      if (profile) {
        setName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim());
        if (profile.phone) setPhone(profile.phone);
      }
      setMyRequests(await getMyMaintenanceRequests());
    })();
  }, []);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !description.trim()) {
      Alert.alert("Completa nombre, teléfono y descripción del problema.");
      return;
    }
    setLoading(true);
    try {
      await createMaintenanceRequest({
        client_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        description: description.trim(),
      });
      Alert.alert(
        "Solicitud enviada",
        "Un técnico revisará tu caso. Te notificaremos cuando haya avances.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="tool" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Solicitar mantenimiento</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Describe el problema con tu pasto. El equipo te contactará.
        </Text>

        {["Nombre *", "Teléfono *", "Correo", "Dirección / ubicación"].map((lbl, i) => {
          const fields = [name, phone, email, address];
          const setters = [setName, setPhone, setEmail, setAddress];
          const keys = ["name", "phone", "email", "address"] as const;
          return (
            <View key={keys[i]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{lbl}</Text>
              <TextInput
                value={fields[i]}
                onChangeText={setters[i]}
                keyboardType={i === 1 ? "phone-pad" : i === 2 ? "email-address" : "default"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          );
        })}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>¿Qué necesitas? *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Ej. Pasto despegado en esquina, limpieza, relleno..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, styles.area, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />

        <Pressable
          onPress={submit}
          disabled={loading}
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Enviar solicitud</Text>}
        </Pressable>

        {myRequests.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis solicitudes</Text>
            {myRequests.map((r) => (
              <View key={r.id} style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{r.status}</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
                  {r.description}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginVertical: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 6, marginBottom: 20, lineHeight: 20 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 6 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_500Medium", marginBottom: 12 },
  area: { minHeight: 100, paddingVertical: 12, textAlignVertical: "top" },
  btn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  reqCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});
