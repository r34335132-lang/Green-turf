import { getClientPushTokens, sendExpoPush } from "@/lib/push";
import { supabase } from "@/lib/supabase";
import { showLocalStaffAlert } from "@/lib/notifications";

export type ClientNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read_at: string | null;
  created_at: string;
};

export async function getClientNotifications(): Promise<ClientNotification[]> {
  const { data, error } = await supabase
    .from("client_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as ClientNotification[]) || [];
}

export async function getUnreadClientCount(): Promise<number> {
  const { count, error } = await supabase
    .from("client_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function markClientNotificationRead(id: string) {
  await supabase
    .from("client_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markAllClientNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("client_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}

/** Admin/vendedor: enviar promoción a todos los clientes registrados */
export async function sendPromotionToClients(title: string, body: string) {
  const { data: clients, error: fetchErr } = await supabase
    .from("profiles")
    .select("id")
    .or("role.eq.cliente,role.is.null");

  if (fetchErr) throw fetchErr;
  const rows = (clients || [])
    .filter((c) => c.id)
    .map((c) => ({
      user_id: c.id,
      title: title.trim(),
      body: body.trim(),
      type: "promo",
    }));

  if (rows.length === 0) {
    throw new Error("No hay clientes registrados para notificar.");
  }

  const { error } = await supabase.from("client_notifications").insert(rows);
  if (error) throw error;

  const tokens = await getClientPushTokens();
  await sendExpoPush(tokens, title.trim(), body.trim());

  return rows.length;
}

export async function showClientLocalAlert(title: string, body: string) {
  await showLocalStaffAlert(title, body);
}
