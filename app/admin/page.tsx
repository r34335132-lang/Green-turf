// app/admin/dashboard.tsx
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

type TabType = "catalog" | "tracking";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("catalog");
  
  // Estados de datos
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Productos
      const { data: prodData } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });

      // 2. Cargar Prospectos de Seguimiento
      const { data: leadData } = await supabase
        .from("leads_tracking")
        .select("*, products(name)")
        .order("updated_at", { ascending: false });

      setProducts(prodData || []);
      setLeads(leadData || []);
    } catch (error: any) {
      Alert.alert("Error", "No se pudo actualizar el tablero: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Función para pausar o activar un pasto (Usa UPDATE optimizado)
  const togglePauseProduct = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_paused: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      // Actualizar estado local eficientemente sin recargar todo de la red
      setProducts(prev => 
        prev.map(p => p.id === id ? { ...p, is_paused: !currentStatus } : p)
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Función para eliminar definitivamente un pasto
  const deleteProduct = (id: string, name: string) => {
    Alert.alert(
      "Eliminar Producto",
      `¿Estás seguro de que deseas eliminar permanentemente el pasto "${name}" del catálogo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("products").delete().eq("id", id);
              if (error) throw error;
              setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error: any) {
              Alert.alert("Error", "No se puede eliminar porque está vinculado a cotizaciones activas.");
            }
          },
        },
      ]
    );
  };

  // Función para cambiar el estado de un prospecto en la tabla de seguimiento
  const advanceLeadStatus = async (leadId: string, currentStatus: string) => {
    const statusOrder: { [key: string]: string } = {
      pendiente: "contactado",
      contactado: "cotizado",
      cotizado: "cerrado",
      cerrado: "descartado",
      descartado: "pendiente",
    };
    
    const nextStatus = statusOrder[currentStatus] || "pendiente";

    try {
      const { error } = await supabase
        .from("leads_tracking")
        .update({ status: nextStatus, updated_at: new Date() })
        .eq("id", leadId);

      if (error) throw error;
      setLeads(prev => 
        prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l)
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Renderizadores de listas
  const renderProductItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            {item.categories?.name || "General"} • {item.height}mm
          </Text>
        </View>
        <Text style={[styles.priceTag, { color: colors.primary }]}>
          ${item.price_per_m2}/m²
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => togglePauseProduct(item.id, item.is_paused)}
          style={[styles.actionButton, { backgroundColor: item.is_paused ? "#22C55E20" : "#F59E0B20" }]}
        >
          <Feather name={item.is_paused ? "play" : "pause"} size={14} color={item.is_paused ? "#22C55E" : "#F59E0B"} />
          <Text style={[styles.actionText, { color: item.is_paused ? "#22C55E" : "#F59E0B" }]}>
            {item.is_paused ? "Activar" : "Pausar"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => deleteProduct(item.id, item.name)}
          style={[styles.actionButton, { backgroundColor: "#EF444420" }]}
        >
          <Feather name="trash-2" size={14} color="#EF4444" />
          <Text style={[styles.actionText, { color: "#EF4444" }]}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderLeadItem = ({ item }: { item: any }) => {
    const statusColors: { [key: string]: string } = {
      pendiente: "#EF4444",
      contactado: "#3B82F6",
      cotizado: "#F59E0B",
      cerrado: "#22C55E",
      descartado: "#6B7280",
    };

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.client_name}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
              Tel: {item.phone} {item.products?.name ? `• Quiere: ${item.products.name}` : ""}
            </Text>
          </View>
          <Pressable 
            onPress={() => advanceLeadStatus(item.id, item.status)}
            style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status] || "#6B7280"}20`, borderColor: statusColors[item.status] }]}
          >
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {item.status.toUpperCase()}
            </Text>
          </Pressable>
        </View>
        
        {item.m2_requested > 0 && (
          <Text style={[styles.leadDetails, { color: colors.foreground }]}>
            Dimensiones solicitadas: <Text style={{ fontFamily: "Inter_700Bold" }}>{item.m2_requested} m²</Text>
          </Text>
        )}
        
        {item.notes && (
          <Text style={[styles.leadNotes, { color: colors.mutedForeground, backgroundColor: colors.background }]}>
            "{item.notes}"
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Superior */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.panelSubtitle, { color: colors.mutedForeground }]}>Panel General</Text>
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>Control de Operaciones</Text>
        </View>
        <Pressable 
          onPress={() => router.push("/admin/add-product")} 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#000" />
        </Pressable>
      </View>

      {/* Tabs Vistosos */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          onPress={() => setActiveTab("catalog")}
          style={[styles.tab, activeTab === "catalog" && { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Feather name="layers" size={16} color={activeTab === "catalog" ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.tabLabel, { color: activeTab === "catalog" ? colors.foreground : colors.mutedForeground }]}>
            Inventario Pastos
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("tracking")}
          style={[styles.tab, activeTab === "tracking" && { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Feather name="users" size={16} color={activeTab === "tracking" ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.tabLabel, { color: activeTab === "tracking" ? colors.foreground : colors.mutedForeground }]}>
            Seguimiento (CRM)
          </Text>
        </Pressable>
      </View>

      {/* Contenido Principal */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === "catalog" ? products : leads}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === "catalog" ? renderProductItem : renderLeadItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          refreshing={loading}
          onRefresh={loadDashboardData}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="folder-open" size={40} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>
                No hay registros disponibles en este apartado.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginVertical: 16 },
  panelSubtitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, uppercase: true, letterSpacing: 1 },
  panelTitle: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 },
  addButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", marginHorizontal: 20, padding: 4, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, py: 10, borderRadius: 8, borderWidth: 1, borderColor: "transparent", paddingVertical: 10 },
  tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  cardSubtitle: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
  priceTag: { fontFamily: "Inter_700Bold", fontSize: 16 },
  divider: { height: 1, marginVertical: 12 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 36, borderRadius: 8 },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statusBadge: { px: 10, py: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  leadDetails: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 10 },
  leadNotes: { fontFamily: "Inter_500Medium", fontSize: 13, fontStyle: "italic", padding: 10, borderRadius: 8, marginTop: 10 },
});