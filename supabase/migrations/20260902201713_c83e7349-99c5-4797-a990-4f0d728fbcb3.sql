ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS step_file_path text,
  ADD COLUMN IF NOT EXISTS step_file_name text,
  ADD COLUMN IF NOT EXISTS step_file_size bigint,
  ADD COLUMN IF NOT EXISTS stl_file_path text,
  ADD COLUMN IF NOT EXISTS stl_file_name text,
  ADD COLUMN IF NOT EXISTS stl_file_size bigint;

UPDATE public.parts
SET stl_file_path = file_path, stl_file_name = file_name, stl_file_size = file_size
WHERE stl_file_path IS NULL AND step_file_path IS NULL
  AND lower(file_name) LIKE '%.stl';

UPDATE public.parts
SET step_file_path = file_path, step_file_name = file_name, step_file_size = file_size
WHERE stl_file_path IS NULL AND step_file_path IS NULL
  AND (lower(file_name) LIKE '%.step' OR lower(file_name) LIKE '%.stp');

ALTER TABLE public.parts ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.parts ALTER COLUMN file_name DROP NOT NULL;

ALTER TABLE public.parts DROP CONSTRAINT IF EXISTS parts_has_at_least_one_file;
ALTER TABLE public.parts
  ADD CONSTRAINT parts_has_at_least_one_file
  CHECK (step_file_path IS NOT NULL OR stl_file_path IS NOT NULL);

DROP POLICY IF EXISTS "Approved part files are readable" ON storage.objects;
CREATE POLICY "Approved part files are readable"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'part-files'
  AND EXISTS (
    SELECT 1 FROM public.parts p
    WHERE p.status = 'approved'
      AND (p.step_file_path = storage.objects.name OR p.stl_file_path = storage.objects.name)
  )
);