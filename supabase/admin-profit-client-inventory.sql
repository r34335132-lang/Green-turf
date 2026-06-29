-- Utilidad por venta, etiquetas de cliente y notas de movimientos de inventario.
-- Ejecutar después de admin-sales.sql y admin-operations.sql.

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS customer_status text NOT NULL DEFAULT 'cotizando';

CREATE INDEX IF NOT EXISTS customers_status_idx
ON public.customers(customer_status, name);

CREATE TABLE IF NOT EXISTS public.sale_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Otro',
  description text,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sale_expenses_sale_idx
ON public.sale_expenses(sale_id, created_at DESC);

ALTER TABLE public.sale_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_expenses_admin_all" ON public.sale_expenses;
CREATE POLICY "sale_expenses_admin_all" ON public.sale_expenses
FOR ALL TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

ALTER TABLE public.inventory_movements
ADD COLUMN IF NOT EXISTS taken_by text,
ADD COLUMN IF NOT EXISTS note text;
