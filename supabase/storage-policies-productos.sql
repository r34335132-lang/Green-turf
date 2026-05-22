-- Políticas de Storage para el bucket "productos"
-- Ejecuta esto en Supabase → SQL Editor (después de crear el bucket "productos" si no existe).
--
-- Nota: desactivar RLS en tablas public.* NO afecta storage.objects.
-- Storage tiene su propio RLS y debe tener políticas explícitas.

-- 1) Verifica que el bucket exista (Dashboard → Storage → New bucket → id: productos, Public: sí)

-- 2) Políticas en storage.objects (idempotente: borra y recrea si ya existían mal)

DROP POLICY IF EXISTS "productos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "productos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "productos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "productos_authenticated_delete" ON storage.objects;

-- Lectura pública (para que image_url con getPublicUrl funcione en la app)
CREATE POLICY "productos_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'productos');

-- Subida solo usuarios autenticados (tu app ya tiene sesión al publicar)
CREATE POLICY "productos_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos');

-- Opcional: actualizar/borrar sus propios archivos
CREATE POLICY "productos_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'productos')
WITH CHECK (bucket_id = 'productos');

CREATE POLICY "productos_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'productos');
