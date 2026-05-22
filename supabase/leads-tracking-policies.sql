-- Cotizaciones (leads_tracking): INSERT invitados + lectura admin
-- Requiere que profiles permita leer el propio rol (para validar admin/vendedor)

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads_tracking;
DROP POLICY IF EXISTS "leads_select_staff" ON public.leads_tracking;
DROP POLICY IF EXISTS "leads_update_staff" ON public.leads_tracking;

-- Cualquier sesión autenticada (incluye invitado anónimo) puede crear cotización
CREATE POLICY "leads_insert_authenticated"
ON public.leads_tracking
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin y vendedor ven todas las cotizaciones
CREATE POLICY "leads_select_staff"
ON public.leads_tracking
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
);

CREATE POLICY "leads_update_staff"
ON public.leads_tracking
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
)
WITH CHECK (true);
