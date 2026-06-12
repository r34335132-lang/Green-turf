-- Green Turf - panel operativo admin
-- Ejecutar despues de supabase/fix-profiles-rls.sql.

CREATE OR REPLACE FUNCTION public.auth_is_operations_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_user_role() IN ('admin', 'vendedor', 'staff', 'instalador');
$$;

GRANT EXECUTE ON FUNCTION public.auth_is_operations_staff() TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  category text NOT NULL DEFAULT 'General',
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL DEFAULT 'Recordatorio',
  status text NOT NULL DEFAULT 'pendiente',
  client_name text,
  client_phone text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'pendiente',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock integer NOT NULL DEFAULT 5;
ALTER TABLE public.leads_tracking ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS admin_notes_updated_idx ON public.admin_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS admin_events_date_idx ON public.admin_events(event_date, event_time);
CREATE INDEX IF NOT EXISTS admin_tasks_status_idx ON public.admin_tasks(status, due_date);
CREATE INDEX IF NOT EXISTS inventory_movements_product_idx
  ON public.inventory_movements(product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_admin_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_notes_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_updated_at BEFORE UPDATE ON public.admin_notes
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

DROP TRIGGER IF EXISTS admin_events_updated_at ON public.admin_events;
CREATE TRIGGER admin_events_updated_at BEFORE UPDATE ON public.admin_events
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

DROP TRIGGER IF EXISTS admin_tasks_updated_at ON public.admin_tasks;
CREATE TRIGGER admin_tasks_updated_at BEFORE UPDATE ON public.admin_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_notes_staff_all" ON public.admin_notes;
CREATE POLICY "admin_notes_staff_all" ON public.admin_notes
FOR ALL TO authenticated
USING (public.auth_is_operations_staff())
WITH CHECK (public.auth_is_operations_staff());

DROP POLICY IF EXISTS "admin_events_staff_all" ON public.admin_events;
CREATE POLICY "admin_events_staff_all" ON public.admin_events
FOR ALL TO authenticated
USING (public.auth_is_operations_staff())
WITH CHECK (public.auth_is_operations_staff());

DROP POLICY IF EXISTS "admin_tasks_staff_all" ON public.admin_tasks;
CREATE POLICY "admin_tasks_staff_all" ON public.admin_tasks
FOR ALL TO authenticated
USING (public.auth_is_operations_staff())
WITH CHECK (public.auth_is_operations_staff());

DROP POLICY IF EXISTS "inventory_movements_staff_all" ON public.inventory_movements;
CREATE POLICY "inventory_movements_staff_all" ON public.inventory_movements
FOR ALL TO authenticated
USING (public.auth_is_operations_staff())
WITH CHECK (public.auth_is_operations_staff());

