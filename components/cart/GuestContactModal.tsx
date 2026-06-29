import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PhoneInput } from "@/components/PhoneInput";
import { useColors } from "@/hooks/useColors";
import { normalizeMexicanPhone, phoneDigits } from "@/lib/phone";

export type GuestContact = {
  name: string;
  phone: string;
  email: string;
};

type Props = {
  visible: boolean;
  initial?: Partial<GuestContact>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (contact: GuestContact) => void;
};

export function GuestContactModal({
  visible,
  initial,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setPhone(initial?.phone ?? "");
      setEmail(initial?.email ?? "");
    }
  }, [visible, initial?.name, initial?.phone, initial?.email]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) return;
    if (phoneDigits(trimmedPhone).length !== 10) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return;
    onSubmit({
      name: trimmedName,
      phone: normalizeMexicanPhone(trimmedPhone),
      email: trimmedEmail,
    });
  };

  const nameOk = name.trim().length >= 2;
  const phoneOk = phoneDigits(phone).length === 10;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Datos de contacto
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
            Como invitado, necesitamos tu nombre, teléfono y correo para que un asesor te contacte.
          </Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Nombre completo *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej. Juan Pérez"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Clave lada y número *
          </Text>
          <PhoneInput value={phone} onChangeText={setPhone} />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Correo *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading || !nameOk || !phoneOk || !emailOk}
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                opacity: loading || !nameOk || !phoneOk || !emailOk ? 0.5 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>Enviar cotización</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 32,
    gap: 8,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});
