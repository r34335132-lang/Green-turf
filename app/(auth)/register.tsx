// app/(auth)/register.tsx
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
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !firstName) {
      Alert.alert("Campos incompletos", "Por favor introduce tu nombre y credenciales básicas.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      Alert.alert("Error de registro", error.message);
    } else {
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.trim().toLowerCase(),
          role: "cliente",
        });
      }
      Alert.alert("Cuenta creada", "¡Bienvenido a Green Turf!", [
        { text: "Entrar", onPress: () => router.replace("/(tabs)") }
      ]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom }]}>
          
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>

          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: colors.foreground }]}>Crear Cuenta</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Únete para cotizar y seguir tus proyectos.</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña segura"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
          </View>

          <Pressable onPress={handleRegister} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary }]}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Registrarse</Text>}
          </Pressable>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { width: 44, height: 44, justifyContent: "center", marginBottom: 20 },
  titleWrapper: { marginBottom: 32 },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 15 },
  inputGroup: { gap: 16, marginBottom: 32 },
  row: { flexDirection: "row", gap: 12 },
  inputContainer: { flexDirection: "row", alignItems: "center", height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
  btn: { height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});