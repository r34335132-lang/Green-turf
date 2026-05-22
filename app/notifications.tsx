import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClientNotifications } from "@/context/ClientNotificationsContext";
import { useColors } from "@/hooks/useColors";
import {
  ClientNotification,
  getClientNotifications,
  markClientNotificationRead,
} from "@/lib/clientNotifications";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { markAllRead, refreshUnread } = useClientNotifications();
  const [items, setItems] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getClientNotifications());
      await markAllRead();
      await refreshUnread();
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const iconFor = (type: string) => {
    if (type === "promo") return "gift";
    if (type === "maintenance") return "tool";
    return "bell";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Notificaciones</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No tienes notificaciones
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = !item.read_at;
            return (
              <Pressable
                onPress={() => markClientNotificationRead(item.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: unread ? colors.primary + "12" : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name={iconFor(item.type) as any} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                  <Text style={[styles.date, { color: colors.mutedForeground }]}>
                    {new Date(item.created_at).toLocaleString("es-MX")}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  cardBody: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, lineHeight: 18 },
  date: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 6 },
  empty: { alignItems: "center", padding: 48, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
