-- Ejecutar después de admin-sales.sql para instalaciones existentes.

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_status text NOT NULL DEFAULT 'cotizando';

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS applies_iva boolean NOT NULL DEFAULT false;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_rate numeric(5,4) NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.sale_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Otro',
  description text,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_expenses_admin_all" ON public.sale_expenses;
CREATE POLICY "sale_expenses_admin_all" ON public.sale_expenses
FOR ALL TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS customers_assigned_to_idx ON public.customers(assigned_to, name);

UPDATE public.customers
SET assigned_to = created_by
WHERE assigned_to IS NULL AND created_by IS NOT NULL;

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

DO $$
BEGIN
  IF to_regclass('public.leads_tracking') IS NOT NULL THEN
    DROP POLICY IF EXISTS "leads_select_staff" ON public.leads_tracking;
    DROP POLICY IF EXISTS "leads_update_staff" ON public.leads_tracking;

    CREATE POLICY "leads_select_staff"
    ON public.leads_tracking FOR SELECT TO authenticated
    USING (
      public.auth_user_role() = 'admin'
      OR assigned_to = auth.uid()
    );

    CREATE POLICY "leads_update_staff"
    ON public.leads_tracking FOR UPDATE TO authenticated
    USING (
      public.auth_user_role() = 'admin'
      OR assigned_to = auth.uid()
    )
    WITH CHECK (
      public.auth_user_role() = 'admin'
      OR assigned_to = auth.uid()
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_with_items(
  sale_payload jsonb,
  items_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
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
    RAISE EXCEPTION 'Solo administradores pueden registrar ventas';
  END IF;

  SELECT COALESCE(SUM(GREATEST(0,
    COALESCE((item->>'quantity')::numeric, 0) * COALESCE((item->>'unit_price')::numeric, 0)
    - COALESCE((item->>'discount')::numeric, 0)
  )), 0)
  INTO calculated_subtotal
  FROM jsonb_array_elements(items_payload) item;

  IF calculated_subtotal <= 0 THEN RAISE EXCEPTION 'La venta debe incluir conceptos con importe'; END IF;
  sale_discount := GREATEST(0, COALESCE((sale_payload->>'discount')::numeric, 0));
  sale_applies_iva := COALESCE((sale_payload->>'applies_iva')::boolean, false);
  sale_tax_rate := CASE WHEN sale_applies_iva THEN 0.16 ELSE 0 END;
  calculated_tax := ROUND(GREATEST(0, calculated_subtotal - sale_discount) * sale_tax_rate, 2);
  calculated_total := GREATEST(0, calculated_subtotal - sale_discount) + calculated_tax;

  INSERT INTO public.sales (folio, customer_id, sale_date, subtotal, discount, applies_iva, tax_rate, tax_amount, total, payment_method, payment_status, amount_paid, notes)
  VALUES (
    sale_payload->>'folio', (sale_payload->>'customer_id')::uuid,
    COALESCE((sale_payload->>'sale_date')::date, current_date),
    calculated_subtotal, sale_discount, sale_applies_iva, sale_tax_rate, calculated_tax, calculated_total,
    COALESCE(NULLIF(sale_payload->>'payment_method', ''), 'Efectivo'),
    COALESCE(NULLIF(sale_payload->>'payment_status', ''), 'pagado'),
    LEAST(calculated_total, GREATEST(0, COALESCE((sale_payload->>'amount_paid')::numeric, calculated_total))),
    NULLIF(sale_payload->>'notes', '')
  ) RETURNING id INTO new_sale_id;

  INSERT INTO public.sale_items (sale_id, product_id, item_type, description, quantity, unit_price, discount, line_total)
  SELECT new_sale_id, NULLIF(item->>'product_id', '')::uuid,
    COALESCE(NULLIF(item->>'item_type', ''), 'producto'), item->>'description',
    (item->>'quantity')::numeric, (item->>'unit_price')::numeric,
    COALESCE((item->>'discount')::numeric, 0),
    GREATEST(0, (item->>'quantity')::numeric * (item->>'unit_price')::numeric - COALESCE((item->>'discount')::numeric, 0))
  FROM jsonb_array_elements(items_payload) item;

  RETURN new_sale_id;
END;
$function$;
