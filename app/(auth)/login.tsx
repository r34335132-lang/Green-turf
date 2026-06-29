// app/(auth)/login.tsx
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Error de acceso", error.message);
    else router.replace("/(tabs)");
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    // Crea una sesión válida pero anónima para que puedan navegar
    const { error } = await supabase.auth.signInAnonymously();
    if (error) Alert.alert("Error", "No se pudo entrar como invitado. Revisa Supabase.");
    else router.replace("/(tabs)");
    setGuestLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} bounces={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
          
          {/* Header Visual */}
          <View style={styles.headerImageContainer}>
            <Image 
              source={require("../../assets/images/hero_rooftop.png")} 
              style={styles.headerImage} 
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: colors.background }]} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.titleWrapper}>
              <Text style={[styles.title, { color: colors.foreground }]}>Bienvenido a Green Turf</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Inicia sesión para gestionar tus proyectos</Text>
            </View>

            {/* Inputs con Iconos */}
            <View style={styles.inputGroup}>
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
                  placeholder="Contraseña"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>

            <Pressable onPress={handleLogin} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary }]}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Ingresar</Text>}
            </Pressable>

            {/* Separador */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>O</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Botón de Invitado */}
            <Pressable 
              onPress={handleGuestLogin} 
              disabled={guestLoading} 
              style={[styles.guestBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {guestLoading ? <ActivityIndicator color={colors.foreground} /> : (
                <>
                  <Feather name="user" size={18} color={colors.foreground} />
                  <Text style={[styles.guestBtnText, { color: colors.foreground }]}>Continuar como Invitado</Text>
                </>
              )}
            </Pressable>

            <Pressable onPress={() => router.push("/(auth)/register")} style={styles.footerLink}>
              <Text style={[styles.link, { color: colors.mutedForeground }]}>
                ¿No tienes una cuenta? <Text style={{ color: colors.primary }}>Regístrate aquí</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerImageContainer: { height: 280, width: "100%", position: "relative" },
  headerImage: { width: "100%", height: "100%" },
  imageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, opacity: 0.9, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  formContainer: { flex: 1, paddingHorizontal: 24, marginTop: -40, zIndex: 10 },
  titleWrapper: { marginBottom: 32 },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 15 },
  inputGroup: { gap: 16, marginBottom: 24 },
  inputContainer: { flexDirection: "row", alignItems: "center", height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
  btn: { height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginHorizontal: 16 },
  guestBtn: { flexDirection: "row", height: 56, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  guestBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  footerLink: { marginTop: 32, alignItems: "center" },
  link: { fontFamily: "Inter_600SemiBold", fontSize: 14 }
});
