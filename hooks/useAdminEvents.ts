import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  status: string;
  client_name: string | null;
  client_phone: string | null;
  created_at: string;
};

export type AdminEventInput = Omit<AdminEvent, "id" | "created_at">;

export function useAdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("admin_events")
      .select("*")
      .order("event_date")
      .order("event_time");
    setEvents((data as AdminEvent[]) || []);
    setError(queryError?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (input: AdminEventInput, id?: string) => {
    const query = id
      ? supabase.from("admin_events").update(input).eq("id", id)
      : supabase.from("admin_events").insert(input);
    const { error: saveError } = await query;
    if (saveError) throw saveError;
    await refresh();
  };

  const remove = async (id: string) => {
    const { error: deleteError } = await supabase.from("admin_events").delete().eq("id", id);
    if (deleteError) throw deleteError;
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  return { events, loading, error, refresh, save, remove };
}

