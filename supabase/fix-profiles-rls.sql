-- FIX: infinite recursion en RLS de profiles (error 42P17)
-- Ejecuta TODO este archivo en SQL Editor (reemplaza políticas conflictivas)

-- 1) Funciones auxiliares (SECURITY DEFINER = leen role SIN disparar RLS otra vez)
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'cliente'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_user_role() IN ('admin', 'vendedor');
$$;

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_user_role() = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_admin() TO authenticated;

-- 2) Quitar TODAS las políticas conflictivas en profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_staff_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_push" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Políticas nuevas (sin subconsultas a profiles)

-- Leer: tu fila + staff ve todos (para tokens push y lista vendedores)
CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.auth_is_staff());

-- Actualizar: tu fila (token push, teléfono, etc.)
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin puede cambiar rol de otros
CREATE POLICY "profiles_admin_update"
ON public.profiles FOR UPDATE TO authenticated
USING (public.auth_is_admin())
WITH CHECK (public.auth_is_admin());

-- Insertar solo tu propia fila
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 4) Re-fix leads_tracking (también usaba subconsulta a profiles)
DROP POLICY IF EXISTS "leads_select_staff" ON public.leads_tracking;
DROP POLICY IF EXISTS "leads_update_staff" ON public.leads_tracking;

CREATE POLICY "leads_select_staff"
ON public.leads_tracking FOR SELECT TO authenticated
USING (
  public.auth_is_admin()
  OR assigned_to = auth.uid()
  OR (assigned_to IS NULL AND public.auth_user_role() = 'vendedor')
);

CREATE POLICY "leads_update_staff"
ON public.leads_tracking FOR UPDATE TO authenticated
USING (
  public.auth_is_admin()
  OR assigned_to = auth.uid()
)
WITH CHECK (true);

-- Sincronizar email existente desde auth.users → profiles (una vez)
UPDATE public.profiles p
SET email = lower(trim(u.email))
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND (p.email IS NULL OR p.email = '');
