ALTER TABLE public.parts
  ADD COLUMN reference_only boolean NOT NULL DEFAULT false,
  ADD COLUMN oem_part_numbers text,
  ADD COLUMN aftermarket_part_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN extra_files jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.parts DROP CONSTRAINT IF EXISTS parts_at_least_one_file;
ALTER TABLE public.parts DROP CONSTRAINT IF EXISTS parts_has_step_file;

ALTER TABLE public.parts
  ADD CONSTRAINT parts_at_least_one_file CHECK (
    step_file_path IS NOT NULL
    OR stl_file_path IS NOT NULL
    OR jsonb_array_length(extra_files) > 0
  ) NOT VALID;

DROP POLICY IF EXISTS "Approved part files are readable" ON storage.objects;
CREATE POLICY "Approved part files are readable" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'part-files'
    AND EXISTS (
      SELECT 1
      FROM public.parts p
      WHERE p.status = 'approved'
        AND (
          p.step_file_path = storage.objects.name
          OR p.stl_file_path = storage.objects.name
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(p.extra_files) AS f
            WHERE f->>'path' = storage.objects.name
          )
        )
    )
  );