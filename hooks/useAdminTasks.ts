import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type AdminTask = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
};

export type AdminTaskInput = Omit<AdminTask, "id" | "created_at">;

export function useAdminTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("admin_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    setTasks((data as AdminTask[]) || []);
    setError(queryError?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (input: AdminTaskInput, id?: string) => {
    const query = id
      ? supabase.from("admin_tasks").update(input).eq("id", id)
      : supabase.from("admin_tasks").insert(input);
    const { error: saveError } = await query;
    if (saveError) throw saveError;
    await refresh();
  };

  const setStatus = async (id: string, status: string) => {
    const { error: updateError } = await supabase.from("admin_tasks").update({ status }).eq("id", id);
    if (updateError) throw updateError;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
  };

  const remove = async (id: string) => {
    const { error: deleteError } = await supabase.from("admin_tasks").delete().eq("id", id);
    if (deleteError) throw deleteError;
    setTasks((current) => current.filter((task) => task.id !== id));
  };

  return { tasks, loading, error, refresh, save, setStatus, remove };
}

