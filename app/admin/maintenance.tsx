import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  MaintenanceLog,
  MaintenanceRequest,
  advanceMaintenanceStatus,
  createMaintenanceLog,
  getMaintenanceLogs,
  getMaintenanceRequests,
} from "@/lib/maintenance";

type SubTab = "requests" | "logs" | "add";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "#EF4444",
  en_proceso: "#3B82F6",
  completado: "#22C55E",
};

export default function AdminMaintenanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [subTab, setSubTab] = useState<SubTab>("requests");
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logDesc, setLogDesc] = useState("");
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [notifyClient, setNotifyClient] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [req, log] = await Promise.all([getMaintenanceRequests(), getMaintenanceLogs()]);
      setRequests(req);
      setLogs(log);
    } catch (e: any) {
      Alert.alert("Error", e.message + "\n\n¿Ejecutaste promo-maintenance.sql?");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSaveLog = async () => {
    if (!logTitle.trim() || !logDesc.trim()) {
      Alert.alert("Título y descripción son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await createMaintenanceLog({
        request_id: linkedRequestId,
        title: logTitle,
        description: logDesc,
        notify_client: notifyClient,
      });
      setLogTitle("");
      setLogDesc("");
      setLinkedRequestId(null);
      setSubTab("logs");
      await load();
      Alert.alert("Registrado", notifyClient ? "El cliente fue notificado." : "Cambio guardado.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderRequest = ({ item }: { item: MaintenanceRequest }) => {
    const sc = STATUS_COLORS[item.status] || "#6B7280";
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: sc }]}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.client_name}</Text>
          <Pressable
            onPress={async () => {
              const next = await advanceMaintenanceStatus(item.id, item.status);
              setRequests((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: next } : r)));
            }}
            style={[styles.pill, { borderColor: sc, backgroundColor: sc + "20" }]}
          >
            <Text style={[styles.pillText, { color: sc }]}>{item.status.replace("_", " ")}</Text>
          </Pressable>
        </View>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {item.phone} · {item.email || "sin correo"}
        </Text>
        {item.address ? (
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.address}</Text>
        ) : null}
        <Text style={[styles.desc, { color: colors.foreground }]}>{item.description}</Text>
        <Pressable
          onPress={() => {
            setLinkedRequestId(item.id);
            setSubTab("add");
          }}
          style={[styles.linkBtn, { borderColor: colors.primary }]}
        >
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
            + Registrar trabajo en esta solicitud
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderLog = ({ item }: { item: MaintenanceLog }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>{item.description}</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {new Date(item.created_at).toLocaleString("es-MX")}
        {item.request_id ? " · vinculado a solicitud" : ""}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Mantenimiento</Text>
      </View>

      <View style={[styles.subTabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["requests", "logs", "add"] as SubTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setSubTab(t)}
            style={[styles.subTab, subTab === t && { backgroundColor: colors.primary + "20" }]}
          >
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
              {t === "requests" ? `Solicitudes (${requests.length})` : t === "logs" ? "Historial" : "Registrar"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : subTab === "add" ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.form}>
            {linkedRequestId ? (
              <Text style={[styles.linked, { color: colors.primary }]}>
                Vinculado a solicitud del cliente
              </Text>
            ) : null}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Título del trabajo *</Text>
            <TextInput
              value={logTitle}
              onChangeText={setLogTitle}
              placeholder="Ej. Limpieza y relleno de arena"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Cambios realizados *</Text>
            <TextInput
              value={logDesc}
              onChangeText={setLogDesc}
              multiline
              placeholder="Describe qué se hizo..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.area, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>
                Notificar al cliente
              </Text>
              <Switch value={notifyClient} onValueChange={setNotifyClient} trackColor={{ true: colors.primary }} />
            </View>
            <Pressable
              onPress={handleSaveLog}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            >
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveText}>Guardar registro</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={subTab === "requests" ? requests : logs}
          keyExtractor={(i) => i.id}
          renderItem={subTab === "requests" ? renderRequest : renderLog}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              {subTab === "requests" ? "Sin solicitudes aún" : "Sin registros aún"}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subTabs: { flexDirection: "row", marginHorizontal: 20, marginBottom: 12, padding: 4, borderRadius: 12, borderWidth: 1 },
  subTab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  pillText: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "capitalize" },
  meta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  desc: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 8, lineHeight: 20 },
  linkBtn: { marginTop: 12, paddingVertical: 8, alignItems: "center", borderRadius: 8, borderWidth: 1 },
  form: { padding: 20, paddingBottom: 40 },
  linked: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 12 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontFamily: "Inter_500Medium", marginBottom: 14 },
  area: { minHeight: 120, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  saveBtn: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
  empty: { textAlign: "center", padding: 40, fontFamily: "Inter_500Medium" },
});
