// app/(auth)/register.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
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

    const { error } = await supabase.auth.signUp({
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
      Alert.alert("Cuenta creada", "Tu cuenta se ha generado de manera exitosa.", [
        { text: "Entrar", onPress: () => router.replace("/(tabs)") }
      ]);
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Crear Cuenta</Text>
      
      <View style={styles.row}>
        <TextInput
          value={firstName}
          onChangeText={firstName => setFirstName(firstName)}
          placeholder="Nombre"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
        <TextInput
          value={lastName}
          onChangeText={lastName => setLastName(lastName)}
          placeholder="Apellido"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      </View>

      <TextInput
        value={email}
        onChangeText={email => setEmail(email)}
        placeholder="Correo electrónico"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />

      <TextInput
        value={password}
        onChangeText={password => setPassword(password)}
        placeholder="Contraseña segura"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />

      <Pressable onPress={handleRegister} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary }]}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Registrarse</Text>}
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={[styles.link, { color: colors.primary }]}>Volver al Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 10, letterSpacing: -0.5 },
  row: { flexDirection: "row", gap: 12 },
  input: { height: 54, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: "Inter_500Medium" },
  btn: { height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  link: { textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 10 }
});