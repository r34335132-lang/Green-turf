import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { EditorModal, EmptyState, Input, Label, SaveButton } from "@/app/admin/notes";
import { AdminShell } from "@/components/admin/AdminShell";
import { PhoneInput } from "@/components/PhoneInput";
import { useColors } from "@/hooks/useColors";
import { displayMexicanPhone } from "@/lib/phone";
import { Customer, createCustomer, getCustomers, updateCustomer } from "@/lib/sales";
import { getCurrentStaffProfile, getStaffMembers, StaffMember } from "@/lib/staff";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS = [
  { value: "cotizando", label: "Cotizando", color: "#3B82F6" },
  { value: "seguimiento", label: "Seguimiento", color: "#A855F7" },
  { value: "vendido", label: "Vendido", color: "#22C55E" },
  { value: "pausado", label: "Pausado", color: "#F59E0B" },
  { value: "cancelado", label: "Cancelado", color: "#EF4444" },
] as const;

const statusInfo = (value?: string | null) =>
  STATUS_OPTIONS.find((item) => item.value === value) || STATUS_OPTIONS[0];

export default function AdminClientsScreen() {
  const colors = useColors();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [customerModal, setCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [customerStatus, setCustomerStatus] = useState("cotizando");
  const [quotationImage, setQuotationImage] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [assignCustomer, setAssignCustomer] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [staffResult, profileResult, customerResult] = await Promise.allSettled([
      getStaffMembers(),
      getCurrentStaffProfile(),
      getCustomers(),
    ]);
    setStaff(staffResult.status === "fulfilled" ? staffResult.value : []);
    setCustomers(customerResult.status === "fulfilled" ? customerResult.value : []);
    setIsAdmin(profileResult.status === "fulfilled" && profileResult.value?.role === "admin");
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const vendorMap = useMemo(
    () => Object.fromEntries(staff.map((member) => [member.id, member.label])),
    [staff]
  );
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = `${customer.name} ${customer.phone || ""} ${customer.email || ""} ${customer.notes || ""}`
        .toLowerCase()
        .includes(needle);
      return matchesSearch && (statusFilter === "todos" || customer.customer_status === statusFilter);
    });
  }, [customers, search, statusFilter]);

  const grouped = useMemo(() => {
    if (statusFilter !== "todos") return [[statusFilter, filtered]] as Array<[string, Customer[]]>;
    return STATUS_OPTIONS
      .map((option) => [option.value, filtered.filter((customer) => (customer.customer_status || "cotizando") === option.value)] as [string, Customer[]])
      .filter(([, items]) => items.length);
  }, [filtered, statusFilter]);

  const resetCustomerForm = () => {
    setEditingCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setCustomerNotes("");
    setCustomerStatus("cotizando");
    setQuotationImage("");
  };

  const openCustomer = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setCustomerName(customer?.name || "");
    setCustomerPhone(customer?.phone || "");
    setCustomerEmail(customer?.email || "");
    setCustomerAddress(customer?.address || "");
    setCustomerNotes(customer?.notes || "");
    setCustomerStatus(customer?.customer_status || "cotizando");
    setQuotationImage(customer?.quotation_image_url || "");
    setCustomerModal(true);
  };

  const pickQuotationImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setQuotationImage(result.assets[0].uri);
  };

  const uploadQuotationImage = async (uri: string) => {
    if (uri.startsWith("http")) return uri;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const extension = uri.split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
    const path = `customers/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await supabase.storage.from("cotizaciones").upload(path, arrayBuffer, {
      contentType: extension === "png" ? "image/png" : "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    return supabase.storage.from("cotizaciones").getPublicUrl(path).data.publicUrl;
  };

  const saveCustomer = async () => {
    if (!customerName.trim()) return;
    setSavingCustomer(true);
    try {
      const quotationImageUrl = quotationImage ? await uploadQuotationImage(quotationImage) : "";
      const payload = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        notes: customerNotes,
        customer_status: customerStatus,
        quotation_image_url: quotationImageUrl || null,
      };
      if (editingCustomer) await updateCustomer(editingCustomer.id, payload);
      else await createCustomer(payload);
      setCustomerModal(false);
      resetCustomerForm();
      await load();
    } catch (e: any) {
      Alert.alert("No se pudo guardar el cliente", e.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  const assignRegisteredCustomer = async (vendorId: string | null) => {
    if (!assignCustomer) return;
    const { error } = await supabase.from("customers").update({ assigned_to: vendorId }).eq("id", assignCustomer.id);
    if (error) return Alert.alert("No se pudo asignar", error.message);
    setAssignCustomer(null);
    await load();
  };

  return (
    <AdminShell
      title="Clientes"
      subtitle="Seguimiento, datos y cotizaciones organizados por etapa."
      action={<Pressable onPress={() => openCustomer()} style={[styles.newCustomer, { backgroundColor: colors.primary }]}><Feather name="user-plus" size={17} color="#071000" /><Text style={styles.newCustomerText}>Cliente</Text></Pressable>}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por nombre, teléfono, correo o nota..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <FilterChip label="Todos" count={customers.length} color={colors.primary} selected={statusFilter === "todos"} onPress={() => setStatusFilter("todos")} />
          {STATUS_OPTIONS.map((item) => (
            <FilterChip key={item.value} label={item.label} count={customers.filter((customer) => (customer.customer_status || "cotizando") === item.value).length} color={item.color} selected={statusFilter === item.value} onPress={() => setStatusFilter(item.value)} />
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {!loading && grouped.map(([groupStatus, items]) => {
          const info = statusInfo(groupStatus);
          return (
            <View key={groupStatus} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.statusDot, { backgroundColor: info.color }]} />
                <Text style={[styles.groupTitle, { color: colors.foreground }]}>{info.label}</Text>
                <Text style={[styles.groupCount, { color: info.color }]}>{items.length}</Text>
              </View>
              <View style={styles.customerGrid}>
                {items.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} color={info.color} assignedLabel={customer.assigned_to ? vendorMap[customer.assigned_to] : undefined} showAssignment={isAdmin} onOpen={() => router.push(`/customer/${customer.id}` as never)} onEdit={() => openCustomer(customer)} onAssign={isAdmin ? () => setAssignCustomer(customer) : undefined} />
                ))}
              </View>
            </View>
          );
        })}
        {!loading && !filtered.length ? <EmptyState icon="users" title="No hay clientes en este filtro" text="Cambia la etiqueta o registra un cliente nuevo." /> : null}
      </ScrollView>

      <EditorModal visible={!!assignCustomer} onClose={() => setAssignCustomer(null)} title={`Asignar · ${assignCustomer?.name || ""}`}>
        <Label text="Colaborador responsable" />
        <View style={styles.assignList}>
          <Pressable onPress={() => assignRegisteredCustomer(null)} style={[styles.assignChoice, { borderColor: colors.border }]}><Text style={{ color: colors.mutedForeground }}>Sin asignar</Text></Pressable>
          {staff.filter((member) => member.role !== "instalador").map((member) => <Pressable key={member.id} onPress={() => assignRegisteredCustomer(member.id)} style={[styles.assignChoice, { borderColor: assignCustomer?.assigned_to === member.id ? colors.primary : colors.border }]}><Text style={{ color: assignCustomer?.assigned_to === member.id ? colors.primary : colors.foreground }}>{member.label}</Text></Pressable>)}
        </View>
      </EditorModal>

      <EditorModal visible={customerModal} onClose={() => { setCustomerModal(false); resetCustomerForm(); }} title={editingCustomer ? "Editar cliente" : "Nuevo cliente"}>
        <Label text="Nombre *" /><Input value={customerName} onChangeText={setCustomerName} placeholder="Nombre completo o empresa" />
        <Label text="Clave lada y número" /><PhoneInput value={customerPhone} onChangeText={setCustomerPhone} />
        <Label text="Correo" /><Input value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" autoCapitalize="none" />
        <Label text="Dirección" /><Input value={customerAddress} onChangeText={setCustomerAddress} />
        <Label text="Etiqueta de seguimiento" />
        <View style={styles.statusChoices}>{STATUS_OPTIONS.map((item) => <Pressable key={item.value} onPress={() => setCustomerStatus(item.value)} style={[styles.statusChoice, { borderColor: item.color, backgroundColor: customerStatus === item.value ? item.color + "24" : "transparent" }]}><View style={[styles.statusDot, { backgroundColor: item.color }]} /><Text style={[styles.filterText, { color: customerStatus === item.value ? item.color : colors.mutedForeground }]}>{item.label}</Text></Pressable>)}</View>
        <Label text="Foto de la cotización" />
        <Pressable onPress={pickQuotationImage} style={[styles.photoPicker, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {quotationImage ? <Image source={{ uri: quotationImage }} style={styles.photoPreview} contentFit="cover" /> : <><Feather name="camera" size={24} color={colors.primary} /><Text style={[styles.photoText, { color: colors.primary }]}>Subir foto de la cotización</Text></>}
        </Pressable>
        {quotationImage ? <Pressable onPress={() => setQuotationImage("")} style={styles.removePhoto}><Feather name="trash-2" size={14} color="#EF4444" /><Text style={styles.removePhotoText}>Quitar foto</Text></Pressable> : null}
        <Label text="Notas" /><Input value={customerNotes} onChangeText={setCustomerNotes} multiline />
        <SaveButton label={editingCustomer ? "Actualizar cliente" : "Guardar cliente"} saving={savingCustomer} disabled={!customerName.trim()} onPress={saveCustomer} />
      </EditorModal>
    </AdminShell>
  );
}

function FilterChip({ label, count, color, selected, onPress }: { label: string; count: number; color: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filter, { borderColor: color, backgroundColor: selected ? color + "24" : "transparent" }]}><Text style={[styles.filterText, { color: selected ? color : "#8E9891" }]}>{label}</Text><View style={[styles.filterCount, { backgroundColor: color }]}><Text style={styles.filterCountText}>{count}</Text></View></Pressable>;
}

function CustomerCard({ customer, color, assignedLabel, showAssignment, onOpen, onEdit, onAssign }: { customer: Customer; color: string; assignedLabel?: string; showAssignment: boolean; onOpen: () => void; onEdit: () => void; onAssign?: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onOpen} style={[styles.customerCard, { backgroundColor: colors.card, borderColor: color + "70" }]}>
      <View style={[styles.customerIcon, { backgroundColor: color + "20" }]}><Feather name="user" size={20} color={color} /></View>
      <View style={styles.customerCopy}>
        <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.name}</Text>
        <Text style={[styles.customerMeta, { color: colors.mutedForeground }]}>{displayMexicanPhone(customer.phone) || customer.email || "Sin datos de contacto"}</Text>
        {customer.quotation_image_url ? <View style={styles.quoteAvailable}><Feather name="image" size={12} color={color} /><Text style={[styles.quoteAvailableText, { color }]}>Cotización adjunta</Text></View> : null}
        {showAssignment ? <Text style={[styles.assigned, { color }]}>{assignedLabel || "Sin colaborador asignado"}</Text> : null}
      </View>
      <Pressable onPress={(event) => { event.stopPropagation(); onEdit(); }} style={[styles.cardAction, { borderColor: colors.border }]}><Feather name="edit-2" size={15} color={color} /></Pressable>
      {onAssign ? <Pressable onPress={(event) => { event.stopPropagation(); onAssign(); }} style={[styles.cardAction, { borderColor: colors.border }]}><Feather name="user-plus" size={15} color={color} /></Pressable> : null}
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 1000, width: "100%", alignSelf: "center", gap: 14 },
  newCustomer: { height: 42, paddingHorizontal: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  newCustomerText: { color: "#071000", fontFamily: "Inter_700Bold", fontSize: 12 },
  search: { height: 46, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
  filters: { gap: 8, paddingBottom: 4 },
  filter: { minHeight: 36, borderWidth: 1, borderRadius: 100, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 7 },
  filterText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  filterCount: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  filterCountText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 9 },
  group: { gap: 10, marginTop: 8 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  groupTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  groupCount: { fontFamily: "Inter_700Bold", fontSize: 12 },
  customerGrid: { gap: 10 },
  customerCard: { borderRadius: 15, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  customerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  customerCopy: { flex: 1 },
  customerName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  customerMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 },
  quoteAvailable: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  quoteAvailableText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  assigned: { fontFamily: "Inter_600SemiBold", fontSize: 9, marginTop: 4 },
  cardAction: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  assignList: { gap: 8, marginBottom: 10 },
  assignChoice: { minHeight: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, justifyContent: "center" },
  statusChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  statusChoice: { minHeight: 36, borderWidth: 1, borderRadius: 100, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 7 },
  photoPicker: { minHeight: 118, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden", gap: 8, marginBottom: 8 },
  photoPreview: { width: "100%", height: 180 },
  photoText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  removePhoto: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", gap: 5, paddingVertical: 6, marginBottom: 8 },
  removePhotoText: { color: "#EF4444", fontFamily: "Inter_600SemiBold", fontSize: 10 },
});
