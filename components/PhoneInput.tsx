import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatMexicanPhone, phoneDigits } from "@/lib/phone";

export function PhoneInput({
  value,
  onChangeText,
  placeholder = "618 123 4567",
  compact = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.root, compact && styles.rootCompact, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.code, compact && styles.codeCompact, { borderRightColor: colors.border }]}>
        <Text style={[styles.flag, { color: colors.foreground }]}>MX</Text>
        <Text style={[styles.prefix, { color: colors.foreground }]}>+52</Text>
      </View>
      <TextInput
        value={formatMexicanPhone(value)}
        onChangeText={(text) => onChangeText(phoneDigits(text))}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        maxLength={12}
        style={[styles.input, compact && styles.inputCompact, { color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: 48, borderRadius: 11, borderWidth: 1, flexDirection: "row", alignItems: "center", marginBottom: 14, overflow: "hidden" },
  rootCompact: { height: 46, marginBottom: 14 },
  code: { height: 46, minWidth: 78, borderRightWidth: 1, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" },
  codeCompact: { height: 44, minWidth: 64, paddingHorizontal: 8 },
  flag: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  prefix: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 1 },
  input: { flex: 1, minHeight: 46, paddingHorizontal: 13, fontFamily: "Inter_500Medium", fontSize: 14 },
  inputCompact: { height: 44, minHeight: 44, paddingHorizontal: 10, fontSize: 13 },
});
