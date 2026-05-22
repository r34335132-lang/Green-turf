-- CRM: asignación a vendedores + notificaciones automáticas
-- Ejecutar en Supabase SQL Editor

-- 1) Columna para asignar vendedor
ALTER TABLE public.leads_tracking
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_tracking_assigned_to_idx ON public.leads_tracking (assigned_to);

-- 2) Tabla de notificaciones internas
CREATE TABLE IF NOT EXISTS public.staff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads_tracking (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_notifications_recipient_idx
ON public.staff_notifications (recipient_id, created_at DESC);

ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_notifications_select_own" ON public.staff_notifications;
DROP POLICY IF EXISTS "staff_notifications_update_own" ON public.staff_notifications;
DROP POLICY IF EXISTS "staff_notifications_insert_staff" ON public.staff_notifications;

CREATE POLICY "staff_notifications_select_own"
ON public.staff_notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "staff_notifications_update_own"
ON public.staff_notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- 3) Trigger: avisar a admin y vendedores cuando llega cotización
CREATE OR REPLACE FUNCTION public.notify_staff_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_notifications (recipient_id, lead_id, title, body)
  SELECT
    p.id,
    NEW.id,
    'Nueva cotización',
    COALESCE(NEW.client_name, 'Cliente') || ' solicitó cotización' ||
      CASE WHEN COALESCE(NEW.m2_requested, 0) > 0 THEN ' · ' || NEW.m2_requested::text || ' m²' ELSE '' END
  FROM public.profiles p
  WHERE p.role IN ('admin', 'vendedor');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_new_lead ON public.leads_tracking;
CREATE TRIGGER trg_notify_staff_new_lead
AFTER INSERT ON public.leads_tracking
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_lead();

-- 4) Trigger: avisar al vendedor asignado
CREATE OR REPLACE FUNCTION public.notify_staff_lead_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_name text;
BEGIN
  IF NEW.assigned_to IS NULL OR NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to THEN
    RETURN NEW;
  END IF;

  SELECT trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
  INTO vendor_name
  FROM public.profiles WHERE id = NEW.assigned_to;

  INSERT INTO public.staff_notifications (recipient_id, lead_id, title, body)
  VALUES (
    NEW.assigned_to,
    NEW.id,
    'Cotización asignada',
    'Te asignaron la cotización de ' || COALESCE(NEW.client_name, 'un cliente')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_lead_assigned ON public.leads_tracking;
CREATE TRIGGER trg_notify_staff_lead_assigned
AFTER UPDATE OF assigned_to ON public.leads_tracking
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_lead_assigned();

-- 5) Actualizar políticas de lectura de leads (admin todo, vendedor asignadas + sin asignar)
DROP POLICY IF EXISTS "leads_select_staff" ON public.leads_tracking;
DROP POLICY IF EXISTS "leads_update_staff" ON public.leads_tracking;

CREATE POLICY "leads_select_staff"
ON public.leads_tracking FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR assigned_to = auth.uid()
  OR (
    assigned_to IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'vendedor')
  )
);

CREATE POLICY "leads_update_staff"
ON public.leads_tracking FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR assigned_to = auth.uid()
)
WITH CHECK (true);

-- 6) Realtime (activar en Dashboard → Database → Replication si no aparece)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.leads_tracking;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notifications;
