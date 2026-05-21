import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { CATEGORIES, Category } from "@/data/products";

interface CategorySectionProps {
  onSelect: (category: Category) => void;
  selected?: Category | null;
}

export function CategorySection({ onSelect, selected }: CategorySectionProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Categorías
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/catalog")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>
            Ver todo
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.id;
          return (
            <CategoryChip
              key={cat.id}
              cat={cat}
              isActive={isActive}
              onSelect={onSelect}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function CategoryChip({
  cat,
  isActive,
  onSelect,
}: {
  cat: (typeof CATEGORIES)[0];
  isActive: boolean;
  onSelect: (c: Category) => void;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onSelect(cat.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          {
            backgroundColor: isActive
              ? colors.primary
              : colors.card,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
      >
        <Feather
          name={cat.icon as any}
          size={15}
          color={isActive ? "#000" : colors.mutedForeground}
        />
        <Text
          style={[
            styles.chipText,
            { color: isActive ? "#000" : colors.foreground },
          ]}
        >
          {cat.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
