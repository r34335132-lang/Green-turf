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
import { supabase } from "@/lib/supabase";

interface Vendor {
  id: string;
  name: string;
  contact_info?: string;
  description?: string;
}

interface Project {
  id: string;
  vendor_id: string;
  title: string;
  description?: string;
  image_url?: string;
  vendors?: { name: string };
}

export default function AddVendorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"vendor" | "project">("vendor");
  
  // Estados para Distribuidor
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorDesc, setVendorDesc] = useState("");
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  
  // Estados para Proyecto
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectImageUrl, setProjectImageUrl] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchVendors();
    if (mode === "project") {
      fetchProjects();
    }
  }, [mode]);

  const fetchVendors = async () => {
    setLoadingData(true);
    const { data } = await supabase.from("vendors").select("*").order("name");
    setVendors(data || []);
    setLoadingData(false);
  };

  const fetchProjects = async () => {
    setLoadingData(true);
    const { data } = await supabase.from("projects").select("*, vendors(name)").order("created_at", { ascending: false });
    setProjects(data || []);
    setLoadingData(false);
  };

  // --- LÓGICA DE DISTRIBUIDORES ---
  const saveVendor = async () => {
    if (!vendorName.trim()) {
      Alert.alert("Error", "El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      if (editingVendorId) {
        // ACTUALIZACIÓN DE REGISTRO EXISTENTE (UPDATE)
        const { error } = await supabase.from("vendors").update({
          name: vendorName.trim(),
          contact_info: vendorContact.trim(),
          description: vendorDesc.trim(),
        }).eq("id", editingVendorId);
        if (error) throw error;
        Alert.alert("Éxito", "Distribuidor actualizado.");
      } else {
        // INSERCIÓN DE NUEVO REGISTRO (INSERT)
        const { error } = await supabase.from("vendors").insert([{
          name: vendorName.trim(),
          contact_info: vendorContact.trim(),
          description: vendorDesc.trim(),
        }]);
        if (error) throw error;
        Alert.alert("Éxito", "Distribuidor agregado.");
      }
      resetVendorForm();
      fetchVendors();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const editVendor = (v: Vendor) => {
    setEditingVendorId(v.id);
    setVendorName(v.name);
    setVendorContact(v.contact_info || "");
    setVendorDesc(v.description || "");
  };

  const deleteVendor = (id: string) => {
    Alert.alert("Confirmar", "¿Eliminar este distribuidor y todos sus proyectos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          await supabase.from("vendors").delete().eq("id", id);
          fetchVendors();
      }}
    ]);
  };

  const resetVendorForm = () => {
    setEditingVendorId(null);
    setVendorName("");
    setVendorContact("");
    setVendorDesc("");
  };

  // --- LÓGICA DE PROYECTOS ---
  const saveProject = async () => {
    if (!selectedVendorId || !projectTitle.trim()) {
      Alert.alert("Error", "Selecciona un distribuidor y escribe un título.");
      return;
    }
    setLoading(true);
    try {
      if (editingProjectId) {
         // ACTUALIZACIÓN DE REGISTRO EXISTENTE (UPDATE)
        const { error } = await supabase.from("projects").update({
          vendor_id: selectedVendorId,
          title: projectTitle.trim(),
          description: projectDesc.trim(),
          image_url: projectImageUrl.trim(),
        }).eq("id", editingProjectId);
        if (error) throw error;
        Alert.alert("Éxito", "Proyecto actualizado.");
      } else {
         // INSERCIÓN DE NUEVO REGISTRO (INSERT)
        const { error } = await supabase.from("projects").insert([{
          vendor_id: selectedVendorId,
          title: projectTitle.trim(),
          description: projectDesc.trim(),
          image_url: projectImageUrl.trim(),
        }]);
        if (error) throw error;
        Alert.alert("Éxito", "Proyecto subido.");
      }
      resetProjectForm();
      fetchProjects();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const editProject = (p: Project) => {
    setEditingProjectId(p.id);
    setSelectedVendorId(p.vendor_id);
    setProjectTitle(p.title);
    setProjectDesc(p.description || "");
    setProjectImageUrl(p.image_url || "");
  };

  const deleteProject = (id: string) => {
    Alert.alert("Confirmar", "¿Eliminar este proyecto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          await supabase.from("projects").delete().eq("id", id);
          fetchProjects();
      }}
    ]);
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjectTitle("");
    setProjectDesc("");
    setProjectImageUrl("");
    setSelectedVendorId("");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 80 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Distribuidores y Proyectos</Text>

        <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={() => { setMode("vendor"); resetVendorForm(); }} style={[styles.tab, mode === "vendor" && { backgroundColor: colors.primary + "25" }]}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Distribuidores</Text>
          </Pressable>
          <Pressable onPress={() => { setMode("project"); resetProjectForm(); }} style={[styles.tab, mode === "project" && { backgroundColor: colors.primary + "25" }]}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Proyectos</Text>
          </Pressable>
        </View>

        {mode === "vendor" ? (
          <>
            <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{editingVendorId ? "Editar Distribuidor" : "Nuevo Distribuidor"}</Text>
              <Field label="Nombre *" value={vendorName} onChangeText={setVendorName} colors={colors} />
              <Field label="Contacto" value={vendorContact} onChangeText={setVendorContact} colors={colors} />
              <Field label="Descripción" value={vendorDesc} onChangeText={setVendorDesc} colors={colors} />
              
              <View style={styles.actionButtons}>
                {editingVendorId && (
                  <Pressable onPress={resetVendorForm} style={[styles.btnOutline, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.foreground }}>Cancelar</Text>
                  </Pressable>
                )}
                <Pressable onPress={saveVendor} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary, flex: 1, marginLeft: editingVendorId ? 10 : 0 }]}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{editingVendorId ? "Actualizar" : "Guardar"}</Text>}
                </Pressable>
              </View>
            </View>

            <Text style={[styles.listTitle, { color: colors.mutedForeground }]}>Distribuidores Existentes</Text>
            {vendors.map(v => (
              <View key={v.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{v.name}</Text>
                  {v.contact_info && <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{v.contact_info}</Text>}
                </View>
                <View style={styles.iconRow}>
                  <Pressable onPress={() => editVendor(v)} style={styles.iconBtn}><Feather name="edit-2" size={18} color={colors.primary} /></Pressable>
                  <Pressable onPress={() => deleteVendor(v.id)} style={styles.iconBtn}><Feather name="trash-2" size={18} color="#ef4444" /></Pressable>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{editingProjectId ? "Editar Proyecto" : "Subir Proyecto"}</Text>
              
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Distribuidor *</Text>
              <View style={styles.clientList}>
                {vendors.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelectedVendorId(v.id)}
                    style={[styles.clientRow, { backgroundColor: selectedVendorId === v.id ? colors.primary + "22" : "transparent", borderColor: selectedVendorId === v.id ? colors.primary : colors.border }]}
                  >
                    <Text style={{ color: colors.foreground }}>{v.name}</Text>
                  </Pressable>
                ))}
              </View>

              <Field label="Título *" value={projectTitle} onChangeText={setProjectTitle} colors={colors} />
              <Field label="Descripción" value={projectDesc} onChangeText={setProjectDesc} colors={colors} />
              <Field label="URL Imagen" value={projectImageUrl} onChangeText={setProjectImageUrl} colors={colors} />

              <View style={styles.actionButtons}>
                {editingProjectId && (
                  <Pressable onPress={resetProjectForm} style={[styles.btnOutline, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.foreground }}>Cancelar</Text>
                  </Pressable>
                )}
                <Pressable onPress={saveProject} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary, flex: 1, marginLeft: editingProjectId ? 10 : 0 }]}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{editingProjectId ? "Actualizar" : "Guardar"}</Text>}
                </Pressable>
              </View>
            </View>

            <Text style={[styles.listTitle, { color: colors.mutedForeground }]}>Proyectos Subidos</Text>
            {projects.map(p => (
              <View key={p.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{p.title}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{p.vendors?.name || 'Sin distribuidor'}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Pressable onPress={() => editProject(p)} style={styles.iconBtn}><Feather name="edit-2" size={18} color={colors.primary} /></Pressable>
                  <Pressable onPress={() => deleteProject(p.id)} style={styles.iconBtn}><Feather name="trash-2" size={18} color="#ef4444" /></Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, colors }: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
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
  
  formContainer: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  
  clientList: { gap: 8, marginBottom: 16, maxHeight: 150 },
  clientRow: { padding: 12, borderRadius: 8, borderWidth: 1 },
  
  field: { marginBottom: 14 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 6 },
  input: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontFamily: "Inter_500Medium" },
  
  actionButtons: { flexDirection: 'row', marginTop: 10 },
  btn: { height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
  btnOutline: { height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, paddingHorizontal: 20 },
  
  listTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 10, marginTop: 10 },
  listItem: { flexDirection: 'row', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 10, alignItems: 'center' },
  itemName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  itemSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  
  iconRow: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 6 },
});
