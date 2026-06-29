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
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StaffToastBanner } from "@/components/admin/StaffToastBanner";
import { ClientToastBanner } from "@/components/client/ClientToastBanner";
import { CartProvider } from "@/context/CartContext";
import { ClientNotificationsProvider } from "@/context/ClientNotificationsContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { StaffNotificationsProvider } from "@/context/StaffNotificationsContext";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase"; // <-- Importamos Supabase
import { fetchMyProfile, isStaffRole } from "@/lib/profile";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function SupabaseConfigErrorScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.configErrorContainer}>
        <Text style={styles.configErrorTitle}>Configura Supabase</Text>
        <Text style={styles.configErrorText}>{supabaseConfigError}</Text>
        <Text style={styles.configErrorHint}>
          Agrega estas variables al environment production de EAS y vuelve a
          generar el build.
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

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
      <Stack.Screen name="notifications" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="maintenance-request" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

async function routeForSession() {
  const profile = await fetchMyProfile();
  router.replace(profile && isStaffRole(profile.role) ? "/(tabs)/operations" : "/(tabs)");
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
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // El setTimeout ayuda a que Expo Router termine de montarse antes de navegar
        setTimeout(() => router.replace("/(auth)/login"), 0);
      } else {
        setTimeout(() => { routeForSession(); }, 0);
      }
    });

    // Escuchar cambios de estado en tiempo real (Logouts o Logins exitosos)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setTimeout(() => router.replace("/(auth)/login"), 0);
      } else if (event === "SIGNED_IN") {
        setTimeout(() => { routeForSession(); }, 0);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Lógica de carga de fuentes
  useEffect(() => {
    if (!isSupabaseConfigured || fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!isSupabaseConfigured) return <SupabaseConfigErrorScreen />;

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <FavoritesProvider>
              <StaffNotificationsProvider>
                <ClientNotificationsProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <StaffToastBanner />
                      <ClientToastBanner />
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </ClientNotificationsProvider>
              </StaffNotificationsProvider>
            </FavoritesProvider>
          </CartProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  configErrorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0A0A0A",
  },
  configErrorTitle: {
    marginBottom: 12,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  configErrorText: {
    marginBottom: 10,
    color: "#FCA5A5",
    fontSize: 15,
    lineHeight: 22,
  },
  configErrorHint: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 21,
  },
});
