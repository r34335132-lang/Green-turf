-- Etiquetas visuales, foto de cotizacion por cliente e historial de abonos.
-- Ejecutar despues de admin-sales.sql y admin-role-permissions.sql.

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS quotation_image_url text;

CREATE TABLE IF NOT EXISTS public.sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'Efectivo',
  payment_date date NOT NULL DEFAULT current_date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sale_payments_sale_idx
ON public.sale_payments(sale_id, payment_date DESC, created_at DESC);

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_payments_admin_all" ON public.sale_payments;
CREATE POLICY "sale_payments_admin_all" ON public.sale_payments
FOR ALL TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

INSERT INTO public.sale_payments (
  sale_id, amount, payment_method, payment_date, notes, created_by, created_at
)
SELECT
  sales.id, sales.amount_paid, sales.payment_method, sales.sale_date,
  'Pago inicial migrado', sales.created_by, sales.created_at
FROM public.sales
WHERE sales.amount_paid > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.sale_payments
    WHERE sale_payments.sale_id = sales.id
  );

CREATE OR REPLACE FUNCTION public.record_initial_sale_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.amount_paid > 0 THEN
    INSERT INTO public.sale_payments (
      sale_id, amount, payment_method, payment_date, notes, created_by
    ) VALUES (
      NEW.id, NEW.amount_paid, NEW.payment_method, NEW.sale_date, 'Pago inicial', NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_record_initial_payment ON public.sales;
CREATE TRIGGER sales_record_initial_payment
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.record_initial_sale_payment();

CREATE OR REPLACE FUNCTION public.add_sale_payment(
  target_sale_id uuid,
  payment_amount numeric,
  payment_method_value text,
  payment_date_value date DEFAULT current_date,
  payment_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  target_sale public.sales%ROWTYPE;
  new_payment_id uuid;
  new_amount_paid numeric(12,2);
BEGIN
  IF public.auth_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden registrar abonos';
  END IF;
  IF payment_amount <= 0 THEN
    RAISE EXCEPTION 'El abono debe ser mayor a cero';
  END IF;

  SELECT * INTO target_sale
  FROM public.sales
  WHERE id = target_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;
  IF target_sale.amount_paid + payment_amount > target_sale.total THEN
    RAISE EXCEPTION 'El abono supera el saldo pendiente';
  END IF;

  INSERT INTO public.sale_payments (
    sale_id, amount, payment_method, payment_date, notes
  ) VALUES (
    target_sale_id,
    payment_amount,
    COALESCE(NULLIF(payment_method_value, ''), 'Efectivo'),
    COALESCE(payment_date_value, current_date),
    NULLIF(payment_notes, '')
  )
  RETURNING id INTO new_payment_id;

  new_amount_paid := target_sale.amount_paid + payment_amount;
  UPDATE public.sales
  SET
    amount_paid = new_amount_paid,
    payment_method = COALESCE(NULLIF(payment_method_value, ''), payment_method),
    payment_status = CASE
      WHEN new_amount_paid >= total THEN 'pagado'
      WHEN new_amount_paid > 0 THEN 'parcial'
      ELSE 'pendiente'
    END
  WHERE id = target_sale_id;

  RETURN new_payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_sale_payment(uuid, numeric, text, date, text) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cotizaciones', 'cotizaciones', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "cotizaciones_public_read" ON storage.objects;
CREATE POLICY "cotizaciones_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'cotizaciones');

DROP POLICY IF EXISTS "cotizaciones_staff_insert" ON storage.objects;
CREATE POLICY "cotizaciones_staff_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cotizaciones' AND public.auth_is_operations_staff());

DROP POLICY IF EXISTS "cotizaciones_staff_update" ON storage.objects;
CREATE POLICY "cotizaciones_staff_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cotizaciones' AND public.auth_is_operations_staff())
WITH CHECK (bucket_id = 'cotizaciones' AND public.auth_is_operations_staff());

DROP POLICY IF EXISTS "cotizaciones_admin_delete" ON storage.objects;
CREATE POLICY "cotizaciones_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cotizaciones' AND public.auth_user_role() = 'admin');
