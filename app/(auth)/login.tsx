// app/(auth)/login.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Alert.alert("Error de acceso", error.message);
    } else {
      router.replace("/(tabs)");
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Green Turf</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Inicia sesión para gestionar tus proyectos</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo electrónico"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />

      <Pressable onPress={handleLogin} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary }]}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Ingresar</Text>}
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/register")}>
        <Text style={[styles.link, { color: colors.mutedForeground }]}>
          ¿No tienes una cuenta? <Text style={{ color: colors.primary }}>Regístrate aquí</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, textAlign: "center", letterSpacing: -1 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center", marginBottom: 20 },
  input: { height: 54, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontFamily: "Inter_500Medium" },
  btn: { height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  link: { textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 12 }
});