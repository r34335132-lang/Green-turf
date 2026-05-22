-- Lectura de productos y categorías (el INSERT ya funciona; sin SELECT la app ve listas vacías)

DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_authenticated_read" ON public.products;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;

-- Catálogo: cualquiera puede ver productos no pausados
CREATE POLICY "products_public_read"
ON public.products
FOR SELECT
TO public
USING (coalesce(is_paused, false) = false);

-- Admin / usuarios logueados: ver todos (incluidos pausados)
CREATE POLICY "products_authenticated_read"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- Join categories(name) en getProducts
CREATE POLICY "categories_public_read"
ON public.categories
FOR SELECT
TO public
USING (true);
