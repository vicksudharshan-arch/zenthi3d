-- Backfill: rows with no step file but an stl (or legacy) file
UPDATE public.parts
SET step_file_path = COALESCE(stl_file_path, file_path),
    step_file_name = COALESCE(stl_file_name, file_name),
    step_file_size = COALESCE(stl_file_size, file_size)
WHERE step_file_path IS NULL
  AND COALESCE(stl_file_path, file_path) IS NOT NULL;

-- Drop the old constraint referencing multiple file columns
ALTER TABLE public.parts DROP CONSTRAINT IF EXISTS parts_has_at_least_one_file;

-- Replace storage read policy before dropping columns it references
DROP POLICY IF EXISTS "Approved part files are readable" ON storage.objects;

ALTER TABLE public.parts
  DROP COLUMN IF EXISTS stl_file_path,
  DROP COLUMN IF EXISTS stl_file_name,
  DROP COLUMN IF EXISTS stl_file_size,
  DROP COLUMN IF EXISTS file_path,
  DROP COLUMN IF EXISTS file_name,
  DROP COLUMN IF EXISTS file_size;

ALTER TABLE public.parts
  ADD CONSTRAINT parts_has_step_file CHECK (step_file_path IS NOT NULL);

CREATE POLICY "Approved part files are readable"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'part-files'
  AND EXISTS (
    SELECT 1 FROM public.parts p
    WHERE p.status = 'approved'
      AND p.step_file_path = storage.objects.name
  )
);