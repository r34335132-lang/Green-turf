import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type InventoryMovement = {
  id: string;
  product_id: string | null;
  movement_type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
};

export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("inventory_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setMovements((data as InventoryMovement[]) || []);
    setError(queryError?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = async (input: Omit<InventoryMovement, "id" | "created_at">) => {
    const { error: insertError } = await supabase.from("inventory_movements").insert(input);
    if (insertError) throw insertError;
    await refresh();
  };

  return { movements, loading, error, refresh, register };
}
