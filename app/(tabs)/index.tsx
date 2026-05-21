import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeroBanner } from "@/components/home/HeroBanner";
import { CategorySection } from "@/components/home/CategorySection";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useCart } from "@/context/CartContext";
import { Category, PRODUCTS } from "@/data/products";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [400, 480],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const featured = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 3);
  const newArrivals = PRODUCTS.filter((p) => p.isNew).slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Floating Header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            opacity: headerOpacity,
            backgroundColor: colors.background,
            paddingTop: insets.top,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerInner}>
          <Text style={[styles.logoSmall, { color: colors.foreground }]}>
            GREEN{" "}
            <Text style={{ color: colors.primary }}>TURF</Text>
          </Text>
          <Pressable onPress={() => router.push("/cart")} style={styles.cartBtn}>
            <Feather name="shopping-bag" size={22} color={colors.foreground} />
            {totalItems > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeCount}>{totalItems}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <HeroBanner />

        <View style={styles.content}>
          {/* Categories */}
          <CategorySection
            onSelect={(cat) =>
              setSelectedCategory((prev) => (prev === cat ? null : cat))
            }
            selected={selectedCategory}
          />

          {/* Featured Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Más vendidos
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/catalog")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  Ver todo
                </Text>
              </Pressable>
            </View>
            <View style={styles.productsList}>
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </View>
          </View>

          {/* AI Visualizer CTA */}
          <Pressable
            onPress={() => router.push("/(tabs)/visualizer")}
            style={[styles.aiCta, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
          >
            <View style={styles.aiCtaContent}>
              <View style={[styles.aiIcon, { backgroundColor: "rgba(109,190,0,0.15)" }]}>
                <Feather name="camera" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiCtaTitle, { color: colors.foreground }]}>
                  IA Visualizadora
                </Text>
                <Text style={[styles.aiCtaDesc, { color: colors.mutedForeground }]}>
                  Mirá cómo se vería el pasto en tu espacio antes de comprarlo
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.primary} />
            </View>
          </Pressable>

          {/* New Arrivals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Nuevos
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            >
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </ScrollView>
          </View>

          {/* Stats Bar */}
          <View style={[styles.stats, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { value: "500+", label: "Proyectos" },
              { value: "15", label: "Años exp." },
              { value: "4.9★", label: "Calificación" },
            ].map((stat, i) => (
              <View key={i} style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Testimonials */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>
              Opiniones
            </Text>
            {TESTIMONIALS.map((t) => (
              <View
                key={t.id}
                style={[styles.testimonial, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.testimonialHeader}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{t.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={[styles.testimonialName, { color: colors.foreground }]}>
                      {t.name}
                    </Text>
                    <Text style={[styles.testimonialRole, { color: colors.mutedForeground }]}>
                      {t.role}
                    </Text>
                  </View>
                  <View style={{ marginLeft: "auto" }}>
                    <Text style={{ color: "#FFD700", fontFamily: "Inter_700Bold" }}>
                      {"★".repeat(t.stars)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.testimonialText, { color: colors.mutedForeground }]}>
                  "{t.text}"
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: insets.bottom + 100 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const TESTIMONIALS = [
  {
    id: "t1",
    name: "María G.",
    role: "Proyecto Residencial",
    stars: 5,
    text: "La calidad del pasto es increíble. Mi jardín quedó como lo soñaba y sin mantenimiento. Totalmente recomendado.",
  },
  {
    id: "t2",
    name: "Carlos R.",
    role: "Complejo Deportivo",
    stars: 5,
    text: "Instalamos tres canchas y el resultado fue espectacular. El equipo de GREEN TURF es muy profesional.",
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoSmall: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 2,
  },
  cartBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCount: {
    color: "#000",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  content: {
    paddingTop: 28,
    gap: 32,
  },
  section: {
    gap: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  productsList: {
    gap: 16,
  },
  aiCta: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  aiCtaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  aiIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCtaTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 4,
  },
  aiCtaDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  stats: {
    marginHorizontal: 20,
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  testimonial: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    marginBottom: 12,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  testimonialName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  testimonialRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  testimonialText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
});
