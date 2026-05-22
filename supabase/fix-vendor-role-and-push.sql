-- Rol vendedor + tokens push (Expo)
-- Ejecutar en SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expo_push_token text;

-- Al crear usuario: respetar role en metadata (vendedor / admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text;
BEGIN
  meta_role := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'cliente');
  IF meta_role NOT IN ('admin', 'vendedor', 'cliente') THEN
    meta_role := 'cliente';
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    lower(trim(NEW.email)),
    meta_role
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = CASE
      WHEN EXCLUDED.role IN ('admin', 'vendedor') THEN EXCLUDED.role
      WHEN profiles.role IN ('admin', 'vendedor') THEN profiles.role
      ELSE EXCLUDED.role
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin puede fijar rol (evita que quede en cliente)
CREATE OR REPLACE FUNCTION public.admin_set_profile_role(target_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden cambiar roles';
  END IF;

  IF new_role NOT IN ('admin', 'vendedor', 'cliente') THEN
    RAISE EXCEPTION 'Rol inválido';
  END IF;

  UPDATE public.profiles SET role = new_role WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(uuid, text) TO authenticated;

-- NOTA: políticas RLS de profiles están en fix-profiles-rls.sql
-- (profiles_select_staff_all causaba recursión infinita 42P17)
