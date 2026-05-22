import { notifyStaffPush, notifyUserPush } from "@/lib/push";
import { supabase } from "@/lib/supabase";

export type MaintenanceRequest = {
  id: string;
  user_id: string | null;
  client_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  description: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceLog = {
  id: string;
  request_id: string | null;
  title: string;
  description: string;
  performed_by: string | null;
  notify_client: boolean;
  created_at: string;
};

const STATUS_FLOW: Record<string, string> = {
  pendiente: "en_proceso",
  en_proceso: "completado",
  completado: "pendiente",
};

export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as MaintenanceRequest[]) || [];
}

export async function getMyMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as MaintenanceRequest[]) || [];
}

export async function createMaintenanceRequest(payload: {
  client_name: string;
  phone: string;
  email?: string;
  address?: string;
  description: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert([
      {
        user_id: user?.id ?? null,
        client_name: payload.client_name,
        phone: payload.phone,
        email: payload.email || null,
        address: payload.address || null,
        description: payload.description,
        status: "pendiente",
      },
    ])
    .select("id")
    .single();

  if (error) throw error;

  await notifyStaffPush(
    "Mantenimiento solicitado",
    `${payload.client_name}: ${payload.description.slice(0, 80)}`
  );

  return data;
}

export async function advanceMaintenanceStatus(id: string, current: string) {
  const next = STATUS_FLOW[current] || "pendiente";
  const { error } = await supabase
    .from("maintenance_requests")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return next;
}

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const { data, error } = await supabase
    .from("maintenance_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as MaintenanceLog[]) || [];
}

export async function createMaintenanceLog(payload: {
  request_id?: string | null;
  title: string;
  description: string;
  notify_client?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("maintenance_logs").insert([
    {
      request_id: payload.request_id || null,
      title: payload.title.trim(),
      description: payload.description.trim(),
      performed_by: user?.id ?? null,
      notify_client: payload.notify_client !== false,
    },
  ]);

  if (error) throw error;

  if (payload.notify_client !== false && payload.request_id) {
    const { data: req } = await supabase
      .from("maintenance_requests")
      .select("user_id")
      .eq("id", payload.request_id)
      .maybeSingle();
    if (req?.user_id) {
      await notifyUserPush(
        req.user_id,
        payload.title.trim(),
        payload.description.trim()
      );
    }
  }
}
