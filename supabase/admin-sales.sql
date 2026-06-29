-- Green Turf - clientes y registro de ventas
-- Ejecutar despues de supabase/admin-operations.sql.

-- Se declara aquí también para que esta migración pueda ejecutarse aunque
-- admin-operations.sql se haya detenido por una tabla CRM opcional ausente.
CREATE OR REPLACE FUNCTION public.set_admin_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- El vínculo CRM es opcional porque algunas instalaciones no usan leads_tracking.
  lead_id uuid,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  customer_status text NOT NULL DEFAULT 'cotizando',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_status text NOT NULL DEFAULT 'cotizando';

-- Agrega la FK únicamente cuando la tabla de cotizaciones existe.
DO $$
BEGIN
  IF to_regclass('public.leads_tracking') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'customers_lead_id_fkey'
        AND conrelid = 'public.customers'::regclass
    )
  THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_lead_id_fkey
      FOREIGN KEY (lead_id)
      REFERENCES public.leads_tracking(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  sale_date date NOT NULL DEFAULT current_date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  applies_iva boolean NOT NULL DEFAULT false,
  tax_rate numeric(5,4) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Efectivo',
  payment_status text NOT NULL DEFAULT 'pagado',
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS applies_iva boolean NOT NULL DEFAULT false;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_rate numeric(5,4) NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  item_type text NOT NULL DEFAULT 'producto',
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Otro',
  description text,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_name_idx ON public.customers(name);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON public.customers(phone);
CREATE INDEX IF NOT EXISTS customers_status_idx ON public.customers(customer_status, name);
CREATE INDEX IF NOT EXISTS customers_assigned_to_idx ON public.customers(assigned_to, name);
CREATE INDEX IF NOT EXISTS sales_customer_idx ON public.sales(customer_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS sales_date_idx ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_expenses_sale_idx ON public.sale_expenses(sale_id, created_at DESC);

DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

DROP TRIGGER IF EXISTS sales_updated_at ON public.sales;
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_staff_all" ON public.customers;
DROP POLICY IF EXISTS "customers_select_assigned" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_staff" ON public.customers;
DROP POLICY IF EXISTS "customers_update_assigned" ON public.customers;
CREATE POLICY "customers_select_assigned" ON public.customers
FOR SELECT TO authenticated
USING (public.auth_user_role() = 'admin' OR assigned_to = auth.uid());

CREATE POLICY "customers_insert_staff" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (public.auth_is_operations_staff() AND (public.auth_user_role() = 'admin' OR assigned_to = auth.uid()));

CREATE POLICY "customers_update_assigned" ON public.customers
FOR UPDATE TO authenticated
USING (public.auth_user_role() = 'admin' OR assigned_to = auth.uid())
WITH CHECK (public.auth_user_role() = 'admin' OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "sales_staff_all" ON public.sales;
DROP POLICY IF EXISTS "sales_admin_all" ON public.sales;
CREATE POLICY "sales_admin_all" ON public.sales
FOR ALL TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

DROP POLICY IF EXISTS "sale_items_staff_all" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_admin_all" ON public.sale_items;
CREATE POLICY "sale_items_admin_all" ON public.sale_items
FOR ALL TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

DROP POLICY IF EXISTS "sale_expenses_admin_all" ON public.sale_expenses;
CREATE POLICY "sale_expenses_admin_all" ON public.sale_expenses
FOR ALL TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.create_sale_with_items(
  sale_payload jsonb,
  items_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_sale_id uuid;
  calculated_subtotal numeric(12,2);
  sale_discount numeric(12,2);
  sale_applies_iva boolean;
  sale_tax_rate numeric(5,4);
  calculated_tax numeric(12,2);
  calculated_total numeric(12,2);
BEGIN
  IF public.auth_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT COALESCE(SUM(
    GREATEST(
      0,
      (COALESCE((item->>'quantity')::numeric, 0) * COALESCE((item->>'unit_price')::numeric, 0))
      - COALESCE((item->>'discount')::numeric, 0)
    )
  ), 0)
  INTO calculated_subtotal
  FROM jsonb_array_elements(items_payload) item;

  IF calculated_subtotal <= 0 THEN
    RAISE EXCEPTION 'La venta debe incluir al menos un concepto con importe';
  END IF;

  sale_discount := GREATEST(0, COALESCE((sale_payload->>'discount')::numeric, 0));
  sale_applies_iva := COALESCE((sale_payload->>'applies_iva')::boolean, false);
  sale_tax_rate := CASE WHEN sale_applies_iva THEN 0.16 ELSE 0 END;
  calculated_tax := ROUND(GREATEST(0, calculated_subtotal - sale_discount) * sale_tax_rate, 2);
  calculated_total := GREATEST(0, calculated_subtotal - sale_discount) + calculated_tax;

  INSERT INTO public.sales (
    folio,
    customer_id,
    sale_date,
    subtotal,
    discount,
    applies_iva,
    tax_rate,
    tax_amount,
    total,
    payment_method,
    payment_status,
    amount_paid,
    notes
  ) VALUES (
    sale_payload->>'folio',
    (sale_payload->>'customer_id')::uuid,
    COALESCE((sale_payload->>'sale_date')::date, current_date),
    calculated_subtotal,
    sale_discount,
    sale_applies_iva,
    sale_tax_rate,
    calculated_tax,
    calculated_total,
    COALESCE(NULLIF(sale_payload->>'payment_method', ''), 'Efectivo'),
    COALESCE(NULLIF(sale_payload->>'payment_status', ''), 'pagado'),
    LEAST(calculated_total, GREATEST(0, COALESCE((sale_payload->>'amount_paid')::numeric, calculated_total))),
    NULLIF(sale_payload->>'notes', '')
  )
  RETURNING id INTO new_sale_id;

  INSERT INTO public.sale_items (
    sale_id,
    product_id,
    item_type,
    description,
    quantity,
    unit_price,
    discount,
    line_total
  )
  SELECT
    new_sale_id,
    NULLIF(item->>'product_id', '')::uuid,
    COALESCE(NULLIF(item->>'item_type', ''), 'producto'),
    item->>'description',
    (item->>'quantity')::numeric,
    (item->>'unit_price')::numeric,
    COALESCE((item->>'discount')::numeric, 0),
    GREATEST(
      0,
      ((item->>'quantity')::numeric * (item->>'unit_price')::numeric)
      - COALESCE((item->>'discount')::numeric, 0)
    )
  FROM jsonb_array_elements(items_payload) item;

  RETURN new_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb) TO authenticated;
