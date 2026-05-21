import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PremiumButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: PremiumButtonProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const bgColors = {
    primary: colors.primary,
    outline: "transparent",
    ghost: "transparent",
    danger: colors.destructive,
  };

  const textColors = {
    primary: colors.primaryForeground,
    outline: colors.primary,
    ghost: colors.mutedForeground,
    danger: "#fff",
  };

  const borders = {
    primary: "transparent",
    outline: colors.primary,
    ghost: "transparent",
    danger: "transparent",
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: "100%" }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          {
            height: heights[size],
            backgroundColor: bgColors[variant],
            borderColor: borders[variant],
            borderWidth: variant === "outline" ? 1.5 : 0,
            opacity: disabled ? 0.4 : 1,
          },
          fullWidth && { width: "100%" },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColors[variant]} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: textColors[variant],
                fontSize: fontSizes[size],
              },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});
