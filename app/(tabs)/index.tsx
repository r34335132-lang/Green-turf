import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/catalog/ProductCard";
import { HeroBanner } from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import { APP_LIMITS } from "@/constants/limits";
import { Product, getProducts } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 12;
const GRID_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const QUICK_ACTIONS = [
  { id: "catalog", label: "Catálogo", icon: "grid", route: "/(tabs)/catalog" as const },
  { id: "visualizer", label: "Visualizador", icon: "camera", route: "/(tabs)/visualizer" as const },
  { id: "calculator", label: "Calculadora", icon: "maximize-2", route: "/calculator" as const },
];

const BENEFITS = [
  { icon: "shield", title: "Garantía", sub: "Calidad certificada" },
  { icon: "truck", title: "Entrega", sub: "A todo México" },
  { icon: "tool", title: "Instalación", sub: "Asesoría incluida" },
  { icon: "award", title: "Premium", sub: "Marcas top" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const data = await getProducts();
          if (active) setProducts(data || []);
        } catch (error) {
          console.error("Error cargando el inicio:", error);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const featured = useMemo(() => {
    const flagged = products.filter((p) => p.isBestSeller || p.isNew);
    const source = flagged.length > 0 ? flagged : products;
    const seen = new Set<string>();
    return source.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 6);
  }, [products]);

  const spotlight = featured[0] ?? products[0];

  const homeGrid = useMemo(
    () => products.slice(0, APP_LIMITS.maxProductsOnHome),
    [products]
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <HeroBanner />

        {/* Header flotante sobre el hero */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View>
            <Text style={[styles.brandLabel, { color: colors.primary }]}>GREEN TURF</Text>
            <Text style={styles.greeting}>Tu pasto ideal, a un toque</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              style={[styles.topIconBtn, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: colors.glassBorder }]}
              onPress={() => router.push("/notifications")}
            >
              <Feather name="bell" size={20} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.topIconBtn, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: colors.glassBorder }]}
              onPress={() => router.push("/cart")}
            >
              <Feather name="shopping-bag" size={20} color="#fff" />
              {totalItems > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.cartBadgeText}>{totalItems > 9 ? "9+" : totalItems}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchWrap}>
          <Pressable
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/catalog")}
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Buscar pasto, categoría o altura...
            </Text>
            <View style={[styles.searchFilter, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="sliders" size={14} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        {/* Accesos rápidos */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(action.route)}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name={action.icon as keyof typeof Feather.glyphMap} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Beneficios */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.benefitsRow}
        >
          {BENEFITS.map((b) => (
            <View
              key={b.title}
              style={[styles.benefitChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={b.icon as keyof typeof Feather.glyphMap} size={16} color={colors.primary} />
              <View>
                <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{b.title}</Text>
                <Text style={[styles.benefitSub, { color: colors.mutedForeground }]}>{b.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <CategorySection />

        {/* Spotlight producto */}
        {spotlight && (
          <Pressable
            style={[styles.spotlight, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/product/${spotlight.id}`)}
          >
            <Image source={{ uri: spotlight.image }} style={styles.spotlightImage} resizeMode="cover" />
            <View style={styles.spotlightOverlay} />
            <View style={styles.spotlightContent}>
              <View style={[styles.spotlightBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.spotlightBadgeText}>DESTACADO</Text>
              </View>
              <Text style={styles.spotlightName}>{spotlight.name}</Text>
              <Text style={styles.spotlightMeta}>
                {spotlight.height} mm · ${spotlight.pricePerM2}/m²
              </Text>
              <View style={styles.spotlightCta}>
                <Text style={styles.spotlightCtaText}>Ver detalle</Text>
                <Feather name="arrow-right" size={16} color="#000" />
              </View>
            </View>
          </Pressable>
        )}

        {featured.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Lo más popular</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Los favoritos de nuestros clientes
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {featured.slice(1).map((item) => (
                <View key={item.id} style={{ width: CARD_WIDTH + 20 }}>
                  <ProductCard product={item} compact />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Banner visualizador IA */}
        <Pressable
          style={[styles.aiBanner, { borderColor: colors.primary + "40" }]}
          onPress={() => router.push("/(tabs)/visualizer")}
        >
          <View style={[styles.aiBannerGlow, { backgroundColor: colors.primary + "12" }]} />
          <View style={styles.aiBannerContent}>
            <View style={[styles.aiIcon, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={22} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiTitle, { color: colors.foreground }]}>
                Visualizador con IA
              </Text>
              <Text style={[styles.aiSub, { color: colors.mutedForeground }]}>
                Sube una foto y mira cómo queda el pasto en tu espacio
              </Text>
            </View>
            <Feather name="chevron-right" size={22} color={colors.primary} />
          </View>
        </Pressable>

        {homeGrid.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Catálogo</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  {products.length} productos disponibles
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/catalog")} style={styles.seeAllBtn}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todo</Text>
                <Feather name="arrow-right" size={14} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {homeGrid.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <ProductCard product={item} compact />
                </View>
              ))}
            </View>
          </View>
        )}

        {products.length === 0 && (
          <View style={styles.emptyBlock}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Pronto habrá pastos disponibles en el catálogo.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push("/cart")}
          style={[styles.ctaBanner, { backgroundColor: colors.primary }]}
        >
          <View>
            <Text style={styles.ctaTitle}>¿Listo para cotizar?</Text>
            <Text style={styles.ctaSub}>Arma tu carrito y recibe asesoría personalizada</Text>
          </View>
          <View style={styles.ctaIcon}>
            <Feather name="arrow-right" size={22} color="#000" />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: GRID_PADDING,
    zIndex: 10,
  },
  brandLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
  },
  greeting: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  topActions: { flexDirection: "row", gap: 10 },
  topIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000" },
  searchWrap: { marginTop: -36, paddingHorizontal: GRID_PADDING, zIndex: 5 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  searchPlaceholder: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  searchFilter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRow: {
    flexDirection: "row",
    paddingHorizontal: GRID_PADDING,
    gap: 10,
    marginTop: 20,
  },
  quickCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center" },
  benefitsRow: { paddingHorizontal: GRID_PADDING, gap: 10, marginTop: 20 },
  benefitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  benefitTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  benefitSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  spotlight: {
    marginHorizontal: GRID_PADDING,
    marginTop: 28,
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  spotlightImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  spotlightContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    gap: 6,
  },
  spotlightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  spotlightBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000", letterSpacing: 0.5 },
  spotlightName: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.3 },
  spotlightMeta: { fontFamily: "Inter_500Medium", fontSize: 14, color: "rgba(255,255,255,0.75)" },
  spotlightCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#6DBE00",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    marginTop: 8,
  },
  spotlightCtaText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000" },
  section: { marginTop: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: GRID_PADDING,
    marginBottom: 16,
  },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.3 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 },
  seeAllText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  horizontalList: {
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
    paddingRight: GRID_PADDING + 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridItem: { width: CARD_WIDTH },
  emptyBlock: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center" },
  aiBanner: {
    marginHorizontal: GRID_PADDING,
    marginTop: 28,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  aiBannerGlow: { ...StyleSheet.absoluteFillObject },
  aiBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  aiSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, lineHeight: 18 },
  ctaBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: GRID_PADDING,
    marginTop: 28,
    padding: 20,
    borderRadius: 18,
  },
  ctaTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#000" },
  ctaSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(0,0,0,0.65)", marginTop: 4 },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
