CREATE POLICY "Approved part files are readable"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'part-files'
  AND EXISTS (
    SELECT 1 FROM public.parts p
    WHERE p.file_path = storage.objects.name
      AND p.status = 'approved'
  )
);