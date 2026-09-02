ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS stl_file_path text,
  ADD COLUMN IF NOT EXISTS stl_file_name text,
  ADD COLUMN IF NOT EXISTS stl_file_size bigint;

DROP POLICY IF EXISTS "Approved part files are readable" ON storage.objects;

CREATE POLICY "Approved part files are readable"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'part-files'
  AND EXISTS (
    SELECT 1 FROM public.parts p
    WHERE p.status = 'approved'
      AND (p.step_file_path = storage.objects.name OR p.stl_file_path = storage.objects.name)
  )
);