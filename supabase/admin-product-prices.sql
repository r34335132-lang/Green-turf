-- Edición de catálogo y precios exclusivamente para administradores.

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update"
ON public.products
FOR UPDATE TO authenticated
USING (public.auth_user_role() = 'admin')
WITH CHECK (public.auth_user_role() = 'admin');

DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert"
ON public.products
FOR INSERT TO authenticated
WITH CHECK (public.auth_user_role() = 'admin');
