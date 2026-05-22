-- Promociones, mantenimiento y notificaciones a clientes
-- Ejecutar después de admin-crm-upgrade.sql

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- Notificaciones para clientes (promos, mantenimiento)
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_notifications_user_idx
ON public.client_notifications (user_id, created_at DESC);

-- Solicitudes de mantenimiento (clientes)
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  client_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente',
  assigned_to uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Registro de trabajos / cambios realizados (staff)
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.maintenance_requests (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  performed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  notify_client boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- === client_notifications ===
DROP POLICY IF EXISTS "client_notif_select_own" ON public.client_notifications;
DROP POLICY IF EXISTS "client_notif_update_own" ON public.client_notifications;
DROP POLICY IF EXISTS "client_notif_insert_staff" ON public.client_notifications;

CREATE POLICY "client_notif_select_own"
ON public.client_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "client_notif_update_own"
ON public.client_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "client_notif_insert_staff"
ON public.client_notifications FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
);

-- === maintenance_requests ===
DROP POLICY IF EXISTS "maint_req_insert" ON public.maintenance_requests;
DROP POLICY IF EXISTS "maint_req_select" ON public.maintenance_requests;
DROP POLICY IF EXISTS "maint_req_update_staff" ON public.maintenance_requests;

CREATE POLICY "maint_req_insert"
ON public.maintenance_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "maint_req_select"
ON public.maintenance_requests FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
);

CREATE POLICY "maint_req_update_staff"
ON public.maintenance_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
);

-- === maintenance_logs ===
DROP POLICY IF EXISTS "maint_log_insert_staff" ON public.maintenance_logs;
DROP POLICY IF EXISTS "maint_log_select" ON public.maintenance_logs;

CREATE POLICY "maint_log_insert_staff"
ON public.maintenance_logs FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
);

CREATE POLICY "maint_log_select"
ON public.maintenance_logs FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
  OR EXISTS (
    SELECT 1 FROM public.maintenance_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()
  )
);

-- Avisar staff: nueva solicitud de mantenimiento
CREATE OR REPLACE FUNCTION public.notify_staff_maintenance_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.staff_notifications (recipient_id, lead_id, title, body)
  SELECT p.id, NULL, 'Mantenimiento solicitado',
    COALESCE(NEW.client_name, 'Cliente') || ': ' || left(COALESCE(NEW.description, ''), 80)
  FROM public.profiles p WHERE p.role IN ('admin', 'vendedor');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_maint_req ON public.maintenance_requests;
CREATE TRIGGER trg_notify_staff_maint_req
AFTER INSERT ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_maintenance_request();

-- Avisar cliente: registro de mantenimiento realizado
CREATE OR REPLACE FUNCTION public.notify_client_maintenance_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_user uuid;
BEGIN
  IF NOT COALESCE(NEW.notify_client, true) THEN RETURN NEW; END IF;

  IF NEW.request_id IS NOT NULL THEN
    SELECT user_id INTO target_user FROM public.maintenance_requests WHERE id = NEW.request_id;
  END IF;

  IF target_user IS NOT NULL THEN
    INSERT INTO public.client_notifications (user_id, title, body, type)
    VALUES (
      target_user,
      COALESCE(NEW.title, 'Actualización de mantenimiento'),
      COALESCE(NEW.description, 'Se registró un avance en tu solicitud.'),
      'maintenance'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_client_maint_log ON public.maintenance_logs;
CREATE TRIGGER trg_notify_client_maint_log
AFTER INSERT ON public.maintenance_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_client_maintenance_log();

-- Permitir a admin actualizar rol de vendedor → ver fix-profiles-rls.sql (profiles_admin_update)
