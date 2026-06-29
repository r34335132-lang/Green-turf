import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type AppRole = "admin" | "staff" | "vendedor" | "instalador" | "cliente";

export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  role: AppRole;
  expo_push_token: string | null;
};

export function normalizeRole(role: string | null | undefined): AppRole {
  const r = (role || "cliente").trim().toLowerCase();
  if (r === "admin" || r === "staff" || r === "vendedor" || r === "instalador") return r;
  return "cliente";
}

export function roleLabel(role: AppRole): string {
  if (role === "admin") return "Administrador";
  if (role === "staff") return "Staff";
  if (role === "vendedor") return "Vendedor";
  if (role === "instalador") return "Instalador";
  return "Cliente";
}

export function isStaffRole(role: AppRole | string): boolean {
  const r = normalizeRole(typeof role === "string" ? role : role);
  return r === "admin" || r === "staff" || r === "vendedor" || r === "instalador";
}

export function isAdminRole(role: AppRole | string): boolean {
  return normalizeRole(typeof role === "string" ? role : role) === "admin";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

/** Copia email/nombre desde auth.users → profiles (el correo vive en auth, no siempre en profiles) */
async function syncProfileFromAuth(
  user: User,
  profile: UserProfile
): Promise<UserProfile> {
  const authEmail = user.email?.trim().toLowerCase() || null;
  const meta = user.user_metadata || {};
  const patch: Record<string, string | null> = {};

  if (authEmail && authEmail !== profile.email) patch.email = authEmail;
  const metaFirst = (meta.first_name as string) || null;
  const metaLast = (meta.last_name as string) || null;
  if (!profile.first_name && metaFirst) patch.first_name = metaFirst;
  if (!profile.last_name && metaLast) patch.last_name = metaLast;

  if (Object.keys(patch).length === 0) return profile;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id, first_name, last_name, phone, email, role, expo_push_token")
    .maybeSingle();

  if (error) {
    console.warn("[syncProfileFromAuth]", error.message);
    return { ...profile, ...patch, role: profile.role };
  }

  return data
    ? ({ ...data, role: normalizeRole(data.role) } as UserProfile)
    : { ...profile, ...patch };
}

function mapProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    first_name: (row.first_name as string) || null,
    last_name: (row.last_name as string) || null,
    phone: (row.phone as string) || null,
    email: (row.email as string) || null,
    role: normalizeRole(row.role as string),
    expo_push_token: (row.expo_push_token as string) || null,
  };
}

/** Lee el perfil del usuario actual; crea fila mínima si falta */
export async function fetchMyProfile(): Promise<UserProfile | null> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    console.warn("[fetchMyProfile] sin sesión:", userErr?.message);
    return null;
  }

  if (user.is_anonymous) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, email, role, expo_push_token")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[fetchMyProfile] error RLS/SQL:", {
      message: error.message,
      code: error.code,
      hint: error.hint,
    });
  }

  if (data) {
    const mapped = mapProfileRow(data);
    return syncProfileFromAuth(user, mapped);
  }

  const meta = user.user_metadata || {};
  const fallback: UserProfile = {
    id: user.id,
    first_name: (meta.first_name as string) || null,
    last_name: (meta.last_name as string) || null,
    phone: null,
    email: (user.email || (meta.email as string) || "").toLowerCase() || null,
    role: normalizeRole((meta.role as string) || "cliente"),
    expo_push_token: null,
  };

  if (error) {
    console.error(
      "[fetchMyProfile] No se pudo leer profiles. Ejecuta supabase/fix-profiles-rls.sql",
      error.message
    );
    return fallback;
  }

  // Fila nueva: solo INSERT (nunca upsert para no pisar role admin en BD)
  const { data: inserted, error: insErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      first_name: fallback.first_name,
      last_name: fallback.last_name,
      email: fallback.email,
      role: "cliente",
    })
    .select("id, first_name, last_name, phone, email, role, expo_push_token")
    .maybeSingle();

  if (insErr?.code === "23505") {
    const { data: retry } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, email, role, expo_push_token")
      .eq("id", user.id)
      .maybeSingle();
    if (retry) {
      return syncProfileFromAuth(user, mapProfileRow(retry));
    }
  }

  if (inserted) {
    return syncProfileFromAuth(user, mapProfileRow(inserted));
  }

  return fallback;
}
