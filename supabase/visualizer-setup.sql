-- Visualizador IA: jobs + bucket storage
-- Ejecutar en SQL Editor

CREATE TABLE IF NOT EXISTS public.visualization_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_name text,
  scene text,
  pile_mm integer,
  category text,
  prompt_used text,
  input_url text,
  result_url text,
  provider text DEFAULT 'replicate',
  model text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visualization_jobs_user_day_idx
ON public.visualization_jobs (user_id, created_at DESC);

ALTER TABLE public.visualization_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "viz_jobs_insert_own" ON public.visualization_jobs;
DROP POLICY IF EXISTS "viz_jobs_select_own" ON public.visualization_jobs;

CREATE POLICY "viz_jobs_insert_own"
ON public.visualization_jobs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "viz_jobs_select_own"
ON public.visualization_jobs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.auth_is_staff());

-- Bucket visualizer (crear también en Dashboard → Storage → visualizer, público lectura)
-- Políticas storage.objects:
DROP POLICY IF EXISTS "visualizer_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "visualizer_public_read" ON storage.objects;

CREATE POLICY "visualizer_upload_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'visualizer' AND (storage.foldername(name))[1] = 'uploads');

CREATE POLICY "visualizer_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'visualizer');

-- Opcional: notas visuales por producto (admin las edita en Supabase)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS visual_style_notes text;

COMMENT ON COLUMN public.products.visual_style_notes IS
  'Notas para IA visualizador. Ej: tono oliva, césped denso 40mm, look premium residencial';
