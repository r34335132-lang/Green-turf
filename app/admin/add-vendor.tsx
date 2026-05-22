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
import { isValidUserId } from "@/lib/profile";
import {
  getCurrentStaffProfile,
  getPromotableClients,
  promoteUserToVendor,
  PromotableClient,
} from "@/lib/staff";
import { supabase } from "@/lib/supabase";

export default function AddVendorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"promote" | "create">("promote");
  const [userId, setUserId] = useState("");
  const [clients, setClients] = useState<PromotableClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPromotableClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false));
  }, []);

  const handlePromote = async () => {
    const id = userId.trim();
    if (!isValidUserId(id)) {
      Alert.alert(
        "ID inválido",
        "Selecciona un usuario de la lista o pega el UUID completo (desde Supabase → Authentication)."
      );
      return;
    }
    setLoading(true);
    try {
      const profile = await getCurrentStaffProfile();
      if (profile?.role !== "admin") {
        throw new Error("Solo administradores pueden agregar vendedores.");
      }

      const { data: target, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!target) {
        Alert.alert(
          "Usuario no encontrado",
          "No hay perfil con ese ID. El usuario debe registrarse en la app al menos una vez."
        );
        setLoading(false);
        return;
      }

      await promoteUserToVendor(id, {
        firstName: firstName.trim() || target.first_name || undefined,
        lastName: lastName.trim() || target.last_name || undefined,
        phone: phone.trim() || undefined,
      });

      Alert.alert("Listo", "Usuario promovido a vendedor.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!email || !password || !firstName) {
      Alert.alert("Campos incompletos", "Nombre, correo y contraseña son obligatorios.");
      return;
    }
    Alert.alert(
      "Crear cuenta de vendedor",
      "Se creará la cuenta. Si tu sesión de admin se cierra, vuelve a iniciar sesión después.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Crear",
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                  data: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: "vendedor",
                  },
                },
              });
              if (error) throw error;
              if (data.user) {
                const newId = data.user.id;
                await new Promise((r) => setTimeout(r, 600));
                await promoteUserToVendor(newId, {
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  phone: phone.trim(),
                });
              }
              Alert.alert(
                "Cuenta creada",
                `Vendedor creado.\nID: ${data.user?.id ?? ""}\nPuede iniciar sesión con su correo.`,
                [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
              );
            } catch (e: any) {
              Alert.alert("Error", e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const submit = mode === "promote" ? handlePromote : handleCreate;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Agregar vendedor</Text>

        <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setMode("promote")}
            style={[styles.tab, mode === "promote" && { backgroundColor: colors.primary + "25" }]}
          >
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              Promover por ID
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("create")}
            style={[styles.tab, mode === "create" && { backgroundColor: colors.primary + "25" }]}
          >
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              Crear cuenta
            </Text>
          </Pressable>
        </View>

        {mode === "promote" ? (
          <>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              El correo está en Authentication, no en profiles. Usa el ID del usuario (UUID).
            </Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Usuarios registrados</Text>
            {loadingClients ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            ) : clients.length === 0 ? (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                No hay clientes. Pide que se registren o pega el UUID de Authentication.
              </Text>
            ) : (
              <View style={styles.clientList}>
                {clients.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setUserId(c.id);
                      setFirstName(c.first_name || "");
                      setLastName(c.last_name || "");
                    }}
                    style={[
                      styles.clientRow,
                      {
                        backgroundColor: userId === c.id ? colors.primary + "22" : colors.card,
                        borderColor: userId === c.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.clientName, { color: colors.foreground }]}>{c.label}</Text>
                    <Text style={[styles.clientId, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {c.id}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Field
              label="ID de usuario (UUID) *"
              value={userId}
              onChangeText={setUserId}
              colors={colors}
              placeholder="f5c1692f-d86d-476e-b1be-333849304a38"
            />
            <Field label="Nombre (opcional)" value={firstName} onChangeText={setFirstName} colors={colors} />
            <Field label="Apellido (opcional)" value={lastName} onChangeText={setLastName} colors={colors} />
            <Field label="Teléfono (opcional)" value={phone} onChangeText={setPhone} colors={colors} keyboardType="phone-pad" />
          </>
        ) : (
          <>
            <Field label="Correo *" value={email} onChangeText={setEmail} colors={colors} keyboardType="email-address" />
            <Field label="Nombre *" value={firstName} onChangeText={setFirstName} colors={colors} />
            <Field label="Apellido" value={lastName} onChangeText={setLastName} colors={colors} />
            <Field label="Teléfono" value={phone} onChangeText={setPhone} colors={colors} keyboardType="phone-pad" />
            <Field label="Contraseña temporal *" value={password} onChangeText={setPassword} colors={colors} secure />
          </>
        )}

        <Pressable
          onPress={submit}
          disabled={loading}
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>{mode === "promote" ? "Promover a vendedor" : "Crear vendedor"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  secure,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboardType?: "email-address" | "phone-pad";
  secure?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  back: { marginBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 20 },
  tabs: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 12 },
  clientList: { gap: 8, marginBottom: 16, maxHeight: 200 },
  clientRow: { padding: 12, borderRadius: 10, borderWidth: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  clientId: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 },
  field: { marginBottom: 14 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 6 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_500Medium" },
  btn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});
