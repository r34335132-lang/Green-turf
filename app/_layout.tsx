import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { supabase } from "@/lib/supabase"; // <-- Importamos Supabase

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Rutas de Autenticación */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* Rutas Principales (Catálogo, Perfil, etc) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Rutas de Administración */}
      <Stack.Screen name="admin" options={{ headerShown: false }} />

      {/* Rutas Modales y Vistas de Detalle */}
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="cart"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="calculator"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Lógica de Autenticación y Redirección
  useEffect(() => {
    // Verificar la sesión inicial al arrancar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // El setTimeout ayuda a que Expo Router termine de montarse antes de navegar
        setTimeout(() => router.replace("/(auth)/login"), 0);
      }
    });

    // Escuchar cambios de estado en tiempo real (Logouts o Logins exitosos)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setTimeout(() => router.replace("/(auth)/login"), 0);
      } else if (event === "SIGNED_IN") {
        setTimeout(() => router.replace("/(tabs)"), 0);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Lógica de carga de fuentes
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <FavoritesProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </FavoritesProvider>
          </CartProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}