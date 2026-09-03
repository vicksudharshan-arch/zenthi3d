ALTER TABLE public.parts ADD CONSTRAINT parts_at_least_one_file CHECK (step_file_path IS NOT NULL OR stl_file_path IS NOT NULL) NOT VALID;
ALTER TABLE public.parts VALIDATE CONSTRAINT parts_at_least_one_file;

-- The storage SELECT policy already allows either matching path (step OR stl), so STL-only approved parts remain readable and STL-only pending parts stay private. Verify the policy expression covers both paths:
DROP POLICY IF EXISTS "Approved part files are readable" ON storage.objects;
CREATE POLICY "Approved part files are readable" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'part-files'
  AND EXISTS (
    SELECT 1 FROM public.parts
    WHERE status = 'approved'
      AND (step_file_path = name OR stl_file_path = name)
  )
);