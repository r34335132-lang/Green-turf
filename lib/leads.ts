import { supabase } from "@/lib/supabase";

export type QuoteContact = {
  name: string;
  phone: string;
  email: string;
};

export type LeadAssignee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string | null;
};

export type LeadRow = {
  id: string;
  client_name: string;
  phone: string;
  email?: string | null;
  grass_type_id?: string | null;
  m2_requested?: number | null;
  status: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  assigned_to?: string | null;
  products?: { name?: string } | null;
  assigned_profile?: LeadAssignee | null;
};

const LEADS_SELECT =
  "*, products(name), assigned_profile:profiles!leads_tracking_assigned_to_fkey(id, first_name, last_name, role)";

export async function getAdminLeads(): Promise<LeadRow[]> {
  let { data, error } = await supabase
    .from("leads_tracking")
    .select(LEADS_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("leads_tracking")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("[getAdminLeads]", error);
    throw error;
  }
  return (data as LeadRow[]) || [];
}
