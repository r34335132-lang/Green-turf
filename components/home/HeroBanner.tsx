import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { HERO_SLIDES } from "@/data/products";

const { width } = Dimensions.get("window");
const SLIDE_HEIGHT = 520;

export function HeroBanner() {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const next = (activeIndex + 1) % HERO_SLIDES.length;
      setActiveIndex(next);
      fadeAnim.setValue(0);
      translateY.setValue(20);
      flatRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
        fadeAnim.setValue(0);
        translateY.setValue(20);
      }
    }
  ).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={HERO_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <ImageBackground
            source={item.image}
            style={styles.slide}
            imageStyle={styles.image}
          >
            <View style={styles.overlay} />
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY }] },
              ]}
            >
              <View style={[styles.badge, { borderColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  GREEN TURF
                </Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Pressable
                onPress={() => router.push("/(tabs)/catalog")}
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.ctaText}>{item.cta}</Text>
                <Feather name="arrow-right" size={16} color="#000" />
              </Pressable>
            </Animated.View>
          </ImageBackground>
        )}
      />

      <View style={styles.dots}>
        {HERO_SLIDES.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setActiveIndex(i);
              flatRef.current?.scrollToIndex({ index: i, animated: true });
            }}
          >
            <Animated.View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? colors.primary : "rgba(255,255,255,0.3)",
                  width: i === activeIndex ? 24 : 6,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SLIDE_HEIGHT,
  },
  slide: {
    width,
    height: SLIDE_HEIGHT,
    justifyContent: "flex-end",
  },
  image: {
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    backgroundImage: Platform.OS === "web"
      ? "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)"
      : undefined,
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 72,
    gap: 12,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    lineHeight: 56,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    marginTop: 8,
  },
  ctaText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
    letterSpacing: 0.3,
  },
  dots: {
    position: "absolute",
    bottom: 28,
    right: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
