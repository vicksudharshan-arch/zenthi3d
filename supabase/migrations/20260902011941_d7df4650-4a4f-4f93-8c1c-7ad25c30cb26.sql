CREATE POLICY "Anyone can upload part files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'part-files');