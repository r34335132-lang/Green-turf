-- IVA opcional para instalaciones donde admin-sales.sql ya fue ejecutado.

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS applies_iva boolean NOT NULL DEFAULT false;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_rate numeric(5,4) NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) NOT NULL DEFAULT 0;

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

  SELECT COALESCE(SUM(GREATEST(
    0,
    COALESCE((item->>'quantity')::numeric, 0) * COALESCE((item->>'unit_price')::numeric, 0)
    - COALESCE((item->>'discount')::numeric, 0)
  )), 0)
  INTO calculated_subtotal
  FROM jsonb_array_elements(items_payload) item;

  IF calculated_subtotal <= 0 THEN
    RAISE EXCEPTION 'La venta debe incluir conceptos con importe';
  END IF;

  sale_discount := GREATEST(0, COALESCE((sale_payload->>'discount')::numeric, 0));
  sale_applies_iva := COALESCE((sale_payload->>'applies_iva')::boolean, false);
  sale_tax_rate := CASE WHEN sale_applies_iva THEN 0.16 ELSE 0 END;
  calculated_tax := ROUND(GREATEST(0, calculated_subtotal - sale_discount) * sale_tax_rate, 2);
  calculated_total := GREATEST(0, calculated_subtotal - sale_discount) + calculated_tax;

  INSERT INTO public.sales (
    folio, customer_id, sale_date, subtotal, discount, applies_iva,
    tax_rate, tax_amount, total, payment_method, payment_status, amount_paid, notes
  )
  VALUES (
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
    sale_id, product_id, item_type, description, quantity,
    unit_price, discount, line_total
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
      (item->>'quantity')::numeric * (item->>'unit_price')::numeric
      - COALESCE((item->>'discount')::numeric, 0)
    )
  FROM jsonb_array_elements(items_payload) item;

  RETURN new_sale_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb) TO authenticated;
