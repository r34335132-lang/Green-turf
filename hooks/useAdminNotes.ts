import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type AdminNote = {
  id: string;
  title: string;
  content: string | null;
  category: string;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminNoteInput = Pick<AdminNote, "title" | "content" | "category" | "is_pinned">;

export function useAdminNotes() {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("admin_notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    setError(queryError?.message ?? null);
    setNotes((data as AdminNote[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (input: AdminNoteInput, id?: string) => {
    const query = id
      ? supabase.from("admin_notes").update(input).eq("id", id)
      : supabase.from("admin_notes").insert(input);
    const { error: saveError } = await query;
    if (saveError) throw saveError;
    await refresh();
  };

  const remove = async (id: string) => {
    const { error: deleteError } = await supabase.from("admin_notes").delete().eq("id", id);
    if (deleteError) throw deleteError;
    setNotes((current) => current.filter((note) => note.id !== id));
  };

  return { notes, loading, error, refresh, save, remove };
}

