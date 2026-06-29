import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = req.headers.get("Authorization") || "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error("Sesión requerida");

    const { data: caller } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (caller?.role !== "admin") throw new Error("Solo un administrador puede crear colaboradores");

    const body = await req.json();
    if (!["vendedor", "staff", "instalador"].includes(body.role)) throw new Error("Rol no permitido");
    if (!body.email || !body.password || body.password.length < 8) throw new Error("Correo y contraseña de al menos 8 caracteres son obligatorios");

    const { data, error } = await adminClient.auth.admin.createUser({
      email: String(body.email).trim().toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name || "",
        last_name: body.last_name || "",
        role: body.role,
      },
    });
    if (error) throw error;

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      first_name: body.first_name || "",
      last_name: body.last_name || "",
      phone: body.phone || null,
      role: body.role,
    });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ id: data.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
