import { fetchMyProfile, isStaffRole as checkStaff, normalizeRole } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { normalizeMexicanPhone } from "@/lib/phone";

export type StaffMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  label: string;
};

export type StaffRole = "admin" | "staff" | "vendedor" | "instalador" | "cliente" | string;

export async function getCurrentStaffProfile(): Promise<{
  id: string;
  role: StaffRole;
  name: string;
} | null> {
  const profile = await fetchMyProfile();
  if (!profile) return null;

  const name =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    profile.email ||
    "Usuario";
  return { id: profile.id, role: profile.role as StaffRole, name };
}

export type PromotableClient = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  phone: string | null;
  label: string;
};

export async function getPromotableClients(): Promise<PromotableClient[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, phone")
    .or("role.eq.cliente,role.is.null")
    .order("first_name");

  if (error) throw error;

  return (data || []).map((p) => {
    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Sin nombre";
    const shortId = p.id.slice(0, 8);
    return {
      ...p,
      label: `${name} · …${shortId}`,
    };
  });
}

export async function promoteUserToVendor(
  userId: string,
  extras?: { firstName?: string; lastName?: string; phone?: string; role?: "vendedor" | "staff" | "instalador" }
) {
  const role = extras?.role || "vendedor";
  const { error: rpcErr } = await supabase.rpc("admin_set_profile_role", {
    target_id: userId,
    new_role: role,
  });
  if (rpcErr) throw rpcErr;

  const patch: Record<string, string | null> = { role };
  if (extras?.firstName?.trim()) patch.first_name = extras.firstName.trim();
  if (extras?.lastName?.trim()) patch.last_name = extras.lastName.trim();
  if (extras?.phone?.trim()) patch.phone = normalizeMexicanPhone(extras.phone);

  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function createStaffAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "vendedor" | "staff" | "instalador";
}) {
  const { data, error } = await supabase.functions.invoke("create-staff", {
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: normalizeMexicanPhone(input.phone),
      role: input.role,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("role", ["admin", "staff", "vendedor", "instalador"])
    .order("first_name");

  if (error) throw error;

  return (data || []).map((p) => {
    const label =
      `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
      (p.role === "admin" ? "Administrador" : "Vendedor");
    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      role: p.role,
      label: `${label} (${p.role})`,
    };
  });
}

export async function assignLeadToVendor(leadId: string, vendorId: string | null) {
  const { error } = await supabase
    .from("leads_tracking")
    .update({ assigned_to: vendorId, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw error;
}

export function isStaffRole(role: string) {
  return checkStaff(normalizeRole(role));
}
